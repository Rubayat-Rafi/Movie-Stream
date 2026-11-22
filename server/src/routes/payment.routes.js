import { Router } from 'express'
import { z } from 'zod'
import { DEFAULT_PLANS } from '../../prisma/seed.js'
import { notifyUser } from '../lib/notifications.js'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { evaluateCoupon } from './coupon.routes.js'

const router = Router()
const STRATOS_BASE = 'https://stratospay.com/api/v1'

const createPaymentSchema = z.object({
  planSlug: z.string().trim().min(1, 'Plan slug is required.'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  couponCode: z.string().trim().optional().default(''),
})

async function ensurePlans() {
  const count = await prisma.subscriptionPlan.count()
  if (count === 0) {
    for (const plan of DEFAULT_PLANS) {
      await prisma.subscriptionPlan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
      })
    }
  }
}

async function activateSubscriptionFromPayment(payment) {
  const now = new Date()
  const periodEnd = new Date(now)
  if (payment.billingCycle === 'YEARLY') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const subscription = await prisma.subscription.upsert({
    where: { userId: payment.userId },
    update: {
      planId: payment.planId,
      status: 'ACTIVE',
      billingCycle: payment.billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId: payment.userId,
      planId: payment.planId,
      status: 'ACTIVE',
      billingCycle: payment.billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    include: { plan: true },
  })

  if (payment.couponCode) {
    await prisma.coupon.updateMany({
      where: { code: payment.couponCode },
      data: { usedCount: { increment: 1 } },
    })
  }

  await notifyUser({
    userId: payment.userId,
    type: 'PAYMENT',
    title: `Subscription Activated: ${subscription.plan.name}`,
    message: `Payment ${payment.externalReference} ($${Number(payment.finalAmount).toFixed(2)}) succeeded. Enjoy ${subscription.plan.resolution} streaming!`,
    link: '/dashboard/subscriptions',
  })

  return subscription
}

// POST /api/payments/create — StreamHub-style payment initiation (StratosPay or Sandbox)
router.post('/create', requireAuth, async (req, res, next) => {
  try {
    await ensurePlans()
    const { planSlug, billingCycle, couponCode } = createPaymentSchema.parse(req.body)

    const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: planSlug } })
    if (!plan) return res.status(404).json({ error: 'Selected plan not found.' })

    const originalAmount =
      billingCycle === 'YEARLY' ? Number(plan.priceYearly) : Number(plan.priceMonthly)

    let discountAmount = 0
    let finalAmount = originalAmount
    let appliedCode = null

    if (couponCode) {
      const evaluated = await evaluateCoupon({
        code: couponCode,
        planSlug: plan.slug,
        orderAmount: originalAmount,
      })
      discountAmount = evaluated.discountAmount
      finalAmount = evaluated.finalAmount
      appliedCode = evaluated.coupon.code
    }

    const externalReference = `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const stratosKey = process.env.STRATOS_SECRET_API_KEY?.trim()
    const provider = stratosKey ? 'STRATOS' : 'SANDBOX'

    // Clean up previous pending payments for this user (StreamHub pattern)
    await prisma.payment.deleteMany({
      where: { userId: req.user.id, status: 'PENDING' },
    })

    const payment = await prisma.payment.create({
      data: {
        externalReference,
        userId: req.user.id,
        planId: plan.id,
        billingCycle,
        originalAmount,
        discountAmount,
        finalAmount,
        couponCode: appliedCode,
        provider,
        status: 'PENDING',
        metadata: {
          planName: plan.name,
          planSlug: plan.slug,
          resolution: plan.resolution,
        },
      },
      include: { plan: true },
    })

    // If 100% coupon makes finalAmount === 0, activate immediately
    if (finalAmount === 0) {
      const completed = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', completedAt: new Date() },
        include: { plan: true },
      })
      const subscription = await activateSubscriptionFromPayment(completed)
      return res.status(201).json({
        mode: 'free_coupon',
        externalReference,
        payment: completed,
        subscription,
      })
    }

    // If StratosPay API key is configured, initiate hosted checkout
    if (stratosKey) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
      const stratosResp = await fetch(`${STRATOS_BASE}/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stratosKey}`,
        },
        body: JSON.stringify({
          amount: Math.round(finalAmount * 100),
          currency: 'USD',
          external_reference: externalReference,
          customer_email: req.user.email,
          return_url: `${clientUrl}/payment/checkout/${externalReference}`,
        }),
      })
      const stratosData = await stratosResp.json().catch(() => ({}))
      if (stratosResp.ok && stratosData?.data?.checkout_url) {
        return res.status(201).json({
          mode: 'stratos',
          externalReference,
          checkoutUrl: stratosData.data.checkout_url,
          payment,
        })
      }
    }

    // Sandbox / Demo Checkout URL
    res.status(201).json({
      mode: 'sandbox',
      externalReference,
      checkoutUrl: `/payment/checkout/${externalReference}`,
      payment,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/payments/verify/:ref — StreamHub-style verification & activation
router.post('/verify/:ref', requireAuth, async (req, res, next) => {
  try {
    const { ref } = req.params
    const payment = await prisma.payment.findUnique({
      where: { externalReference: ref },
      include: { plan: true },
    })

    if (!payment || (payment.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ error: 'Payment transaction not found.' })
    }

    if (payment.status === 'SUCCESS') {
      return res.json({ status: 'SUCCESS', already: true, payment })
    }

    const stratosKey = process.env.STRATOS_SECRET_API_KEY?.trim()
    if (payment.provider === 'STRATOS' && stratosKey) {
      const resp = await fetch(
        `${STRATOS_BASE}/verify-payment/${encodeURIComponent(ref)}`,
        {
          headers: {
            Authorization: `Bearer ${stratosKey}`,
            Accept: 'application/json',
          },
        }
      )
      const body = await resp.json().catch(() => ({}))
      const rawStatus = String(
        body?.data?.status ?? body?.data?.payment_status ?? body?.status ?? ''
      ).toLowerCase()
      if (!['success', 'completed', 'paid', 'approved', 'captured'].includes(rawStatus)) {
        return res.status(202).json({ status: 'PENDING' })
      }
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', completedAt: new Date() },
      include: { plan: true },
    })

    const subscription = await activateSubscriptionFromPayment(updated)
    res.json({ status: 'SUCCESS', payment: updated, subscription })
  } catch (err) {
    next(err)
  }
})

// GET /api/payments/status/:ref
router.get('/status/:ref', requireAuth, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { externalReference: req.params.ref },
      include: { plan: true },
    })
    if (!payment || (payment.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ error: 'Payment not found.' })
    }
    res.json({ payment })
  } catch (err) {
    next(err)
  }
})

// GET /api/payments/my — User's billing history
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 25,
    })
    res.json({ payments })
  } catch (err) {
    next(err)
  }
})

// GET /api/payments/admin/all — Admin transactions list
router.get('/admin/all', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ payments })
  } catch (err) {
    next(err)
  }
})

export default router

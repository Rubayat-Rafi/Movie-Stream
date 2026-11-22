import { Router } from 'express'
import { z } from 'zod'
import { DEFAULT_PLANS } from '../../prisma/seed.js'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const subscribeSchema = z.object({
  planSlug: z.string().trim().min(1, 'Plan slug is required.'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
})

const planPayloadSchema = z.object({
  name: z.string().trim().min(2, 'Plan name is required.').max(80),
  slug: z.string().trim().min(2).max(50).optional(),
  description: z.string().trim().min(5, 'Description is required.').max(255),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0),
  videoQuality: z.string().trim().min(1).max(60).default('Great'),
  resolution: z.string().trim().min(1).max(40).default('1080p (Full HD)'),
  maxScreens: z.coerce.number().int().min(1).max(20).default(2),
  downloadsEnabled: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  features: z.array(z.string().trim().min(1)).default([]),
})

async function ensurePlansExist() {
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

router.get('/plans', async (_req, res, next) => {
  try {
    await ensurePlansExist()
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    })
    res.json({ plans })
  } catch (err) {
    next(err)
  }
})

// Admin: Create dynamic pricing plan
router.post('/plans', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = planPayloadSchema.parse(req.body)
    const slug = (data.slug || data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        videoQuality: data.videoQuality,
        resolution: data.resolution,
        maxScreens: data.maxScreens,
        downloadsEnabled: data.downloadsEnabled,
        isPopular: data.isPopular,
        features: data.features,
      },
    })
    res.status(201).json({ plan })
  } catch (err) {
    next(err)
  }
})

// Admin: Update dynamic pricing plan
router.patch('/plans/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const data = planPayloadSchema.partial().parse(req.body)
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data,
    })
    res.json({ plan })
  } catch (err) {
    next(err)
  }
})

// Admin: Delete pricing plan
router.delete('/plans/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const [subCount, payCount] = await Promise.all([
      prisma.subscription.count({ where: { planId: id } }),
      prisma.payment.count({ where: { planId: id } }),
    ])
    if (subCount > 0 || payCount > 0) {
      return res.status(400).json({
        error:
          'Cannot delete a plan that has active subscribers or payment history. Edit it instead.',
      })
    }
    await prisma.subscriptionPlan.delete({ where: { id } })
    res.json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
      include: { plan: true },
    })
    res.json({ subscription })
  } catch (err) {
    next(err)
  }
})

router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    await ensurePlansExist()
    const { planSlug, billingCycle } = subscribeSchema.parse(req.body)

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug: planSlug },
    })
    if (!plan) {
      return res.status(404).json({ error: 'Selected subscription plan not found.' })
    }

    const now = new Date()
    const periodEnd = new Date(now)
    if (billingCycle === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: req.user.id,
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    })

    res.json({ subscription })
  } catch (err) {
    next(err)
  }
})

router.post('/cancel', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'No active subscription found.' })
    }

    const subscription = await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { cancelAtPeriodEnd: true },
      include: { plan: true },
    })
    res.json({ subscription })
  } catch (err) {
    next(err)
  }
})

router.post('/resume', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'No subscription found.' })
    }

    const subscription = await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { cancelAtPeriodEnd: false, status: 'ACTIVE' },
      include: { plan: true },
    })
    res.json({ subscription })
  } catch (err) {
    next(err)
  }
})

export default router

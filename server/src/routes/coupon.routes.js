import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const createCouponSchema = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters.').max(50),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.coerce.number().positive('Discount value must be positive.'),
  expiryDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  minOrderAmount: z.coerce.number().min(0).optional().default(0),
  applicablePlans: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
})

const validateCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required.'),
  planSlug: z.string().trim().optional(),
  orderAmount: z.coerce.number().min(0),
})

export async function evaluateCoupon({ code, planSlug, orderAmount }) {
  const normalized = code.toUpperCase().trim()
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })

  if (!coupon) throw new Error('Invalid coupon code.')
  if (!coupon.isActive) throw new Error('This coupon is no longer active.')
  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    throw new Error('This coupon has expired.')
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('This coupon has reached its usage limit.')
  }

  const amount = Number(orderAmount) || 0
  if (Number(coupon.minOrderAmount) > 0 && amount < Number(coupon.minOrderAmount)) {
    throw new Error(`Minimum order amount is $${Number(coupon.minOrderAmount).toFixed(2)}.`)
  }

  const plans = Array.isArray(coupon.applicablePlans) ? coupon.applicablePlans : []
  if (plans.length > 0 && planSlug && !plans.includes(planSlug)) {
    throw new Error('This coupon is not valid for the selected plan.')
  }

  let discountAmount =
    coupon.discountType === 'PERCENTAGE'
      ? (amount * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue)

  discountAmount = Math.min(discountAmount, amount)
  const finalAmount = Math.max(0, amount - discountAmount)

  return {
    coupon,
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),
  }
}

// Public/User: Validate coupon code on Pricing / Checkout
router.post('/validate', async (req, res) => {
  try {
    const payload = validateCouponSchema.parse(req.body)
    const result = await evaluateCoupon(payload)
    res.json({
      valid: true,
      coupon: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: Number(result.coupon.discountValue),
      },
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    })
  } catch (err) {
    res.status(400).json({ valid: false, error: err.message || 'Invalid coupon.' })
  }
})

// Admin routes
router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ coupons })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = createCouponSchema.parse(req.body)
    if (data.discountType === 'PERCENTAGE' && (data.discountValue < 1 || data.discountValue > 100)) {
      return res.status(400).json({ error: 'Percentage discount must be between 1 and 100.' })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        usageLimit: data.usageLimit || null,
        minOrderAmount: data.minOrderAmount || 0,
        applicablePlans: data.applicablePlans || [],
        isActive: data.isActive,
      },
    })
    res.status(201).json({ coupon })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/toggle', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.coupon.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Coupon not found.' })

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })
    res.json({ coupon })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await prisma.coupon.delete({ where: { id } })
    res.json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
})

export default router

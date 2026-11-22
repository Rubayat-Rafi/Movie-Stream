import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const tickerSchema = z.object({
  text: z.string().trim().min(3, 'Ticker text is required.').max(500),
  badge: z.string().trim().max(40).optional().default('NEW'),
  link: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  priority: z.coerce.number().int().optional().default(0),
})

const popupSchema = z.object({
  title: z.string().trim().min(3, 'Popup title is required.').max(200),
  message: z.string().trim().min(5, 'Popup message is required.'),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  buttonText: z.string().trim().max(80).optional().default('Claim Offer'),
  buttonLink: z.string().trim().max(255).optional().default('/pricing'),
  couponCode: z.string().trim().max(50).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  showOncePerSession: z.boolean().optional().default(true),
})

// Public: Active tickers + latest active popup
router.get('/public', async (_req, res, next) => {
  try {
    const [tickers, activePopup] = await Promise.all([
      prisma.newsTicker.findMany({
        where: { isActive: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.promoPopup.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])
    res.json({ tickers, activePopup })
  } catch (err) {
    next(err)
  }
})

// ================= ADMIN: NEWS TICKERS =================
router.get('/tickers', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const tickers = await prisma.newsTicker.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({ tickers })
  } catch (err) {
    next(err)
  }
})

router.post('/tickers', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = tickerSchema.parse(req.body)
    const ticker = await prisma.newsTicker.create({
      data: {
        text: data.text,
        badge: data.badge || 'NEW',
        link: data.link || null,
        isActive: data.isActive,
        priority: data.priority,
      },
    })
    res.status(201).json({ ticker })
  } catch (err) {
    next(err)
  }
})

router.patch('/tickers/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const data = tickerSchema.partial().parse(req.body)
    const ticker = await prisma.newsTicker.update({
      where: { id },
      data,
    })
    res.json({ ticker })
  } catch (err) {
    next(err)
  }
})

router.delete('/tickers/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await prisma.newsTicker.delete({ where: { id } })
    res.json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
})

// ================= ADMIN: PROMO POPUPS =================
router.get('/popups', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const popups = await prisma.promoPopup.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ popups })
  } catch (err) {
    next(err)
  }
})

router.post('/popups', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = popupSchema.parse(req.body)
    if (data.isActive) {
      await prisma.promoPopup.updateMany({ data: { isActive: false } })
    }
    const popup = await prisma.promoPopup.create({
      data: {
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl || null,
        buttonText: data.buttonText || 'Claim Offer',
        buttonLink: data.buttonLink || '/pricing',
        couponCode: data.couponCode ? data.couponCode.toUpperCase() : null,
        isActive: data.isActive,
        showOncePerSession: data.showOncePerSession,
      },
    })
    res.status(201).json({ popup })
  } catch (err) {
    next(err)
  }
})

router.patch('/popups/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const data = popupSchema.partial().parse(req.body)
    if (data.isActive === true) {
      await prisma.promoPopup.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      })
    }
    const popup = await prisma.promoPopup.update({
      where: { id },
      data,
    })
    res.json({ popup })
  } catch (err) {
    next(err)
  }
})

router.delete('/popups/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await prisma.promoPopup.delete({ where: { id } })
    res.json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
})

export default router

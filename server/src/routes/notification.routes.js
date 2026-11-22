import { Router } from 'express'
import { z } from 'zod'
import { broadcastNotification } from '../lib/notifications.js'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const broadcastSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  message: z.string().trim().min(5, 'Message must be at least 5 characters.'),
  type: z.enum(['NEW_MOVIE', 'PAYMENT', 'UPDATE', 'PROMO']).default('UPDATE'),
  audience: z
    .enum(['ALL_USERS', 'ACTIVE_SUBSCRIBERS', 'FREE_USERS', 'PREMIUM_USERS'])
    .default('ALL_USERS'),
  link: z.string().trim().max(255).optional().nullable(),
})

router.use(requireAuth)

// GET /api/notifications — Current user's notifications + unread count
router.get('/', async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      }),
    ])
    res.json({ notifications, unreadCount })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/notifications/broadcast (Admin only)
router.post('/broadcast', requireAdmin, async (req, res, next) => {
  try {
    const data = broadcastSchema.parse(req.body)
    const result = await broadcastNotification({
      audience: data.audience,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || null,
    })
    res.status(201).json({ sentCount: result.count })
  } catch (err) {
    next(err)
  }
})

export default router

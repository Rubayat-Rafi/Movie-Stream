import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const createCampaignSchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters.').max(200),
  audience: z.enum(['ALL_USERS', 'ACTIVE_SUBSCRIBERS', 'FREE_USERS', 'PREMIUM_USERS']),
  body: z.string().trim().min(10, 'Email body must be at least 10 characters.'),
  sendNow: z.boolean().default(false),
})

async function countAudience(audience) {
  switch (audience) {
    case 'ACTIVE_SUBSCRIBERS':
      return prisma.subscription.count({ where: { status: 'ACTIVE' } })
    case 'FREE_USERS':
      return prisma.user.count({ where: { subscription: null } })
    case 'PREMIUM_USERS':
      return prisma.subscription.count({
        where: { status: 'ACTIVE', plan: { slug: 'premium' } },
      })
    case 'ALL_USERS':
    default:
      return prisma.user.count()
  }
}

router.use(requireAuth, requireAdmin)

router.get('/', async (_req, res, next) => {
  try {
    const [campaigns, allUsers, activeSubs, freeUsers, premiumUsers] = await Promise.all([
      prisma.emailCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      countAudience('ALL_USERS'),
      countAudience('ACTIVE_SUBSCRIBERS'),
      countAudience('FREE_USERS'),
      countAudience('PREMIUM_USERS'),
    ])

    res.json({
      campaigns,
      audienceCounts: {
        ALL_USERS: allUsers,
        ACTIVE_SUBSCRIBERS: activeSubs,
        FREE_USERS: freeUsers,
        PREMIUM_USERS: premiumUsers,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { subject, audience, body, sendNow } = createCampaignSchema.parse(req.body)
    const recipientCount = await countAudience(audience)

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        audience,
        body,
        status: sendNow ? 'SENT' : 'DRAFT',
        recipientCount,
        openRate: sendNow ? Number((32 + Math.random() * 24).toFixed(1)) : 0,
        sentAt: sendNow ? new Date() : null,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    res.status(201).json({ campaign })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/send', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.emailCampaign.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found.' })
    }

    const recipientCount = await countAudience(existing.audience)
    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        recipientCount,
        openRate: Number((34 + Math.random() * 22).toFixed(1)),
        sentAt: new Date(),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    res.json({ campaign })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await prisma.emailCampaign.delete({ where: { id } })
    res.json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
})

export default router

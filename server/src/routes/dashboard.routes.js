import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/overview', async (req, res, next) => {
  try {
    const [watchlistCount, historyCount, recentHistory, subscription, profiles] =
      await Promise.all([
        prisma.watchlistItem.count({ where: { userId: req.user.id } }),
        prisma.watchHistory.count({ where: { userId: req.user.id } }),
        prisma.watchHistory.findMany({
          where: { userId: req.user.id },
          orderBy: { watchedAt: 'desc' },
          take: 6,
        }),
        prisma.subscription.findUnique({
          where: { userId: req.user.id },
          include: { plan: true },
        }),
        prisma.profile.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'asc' },
        }),
      ])

    const response = {
      personal: {
        watchlistCount,
        historyCount,
        profilesCount: profiles.length,
        recentHistory,
        subscription,
        profiles,
      },
      admin: null,
    }

    if (req.user.role === 'ADMIN') {
      const [totalUsers, activeSubs, plans, campaignsCount, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.subscription.findMany({
          where: { status: 'ACTIVE' },
          include: { plan: true },
        }),
        prisma.subscriptionPlan.findMany({
          include: {
            _count: {
              select: { subscriptions: true },
            },
          },
          orderBy: { priceMonthly: 'asc' },
        }),
        prisma.emailCampaign.count(),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            subscription: {
              include: { plan: true },
            },
          },
        }),
      ])

      const estimatedMrr = activeSubs.reduce((sum, sub) => {
        const monthly =
          sub.billingCycle === 'YEARLY'
            ? Number(sub.plan.priceYearly) / 12
            : Number(sub.plan.priceMonthly)
        return sum + monthly
      }, 0)

      response.admin = {
        totalUsers,
        activeSubscriptions: activeSubs.length,
        estimatedMrr: Number(estimatedMrr.toFixed(2)),
        campaignsCount,
        planBreakdown: plans.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          subscribers: p._count.subscriptions,
        })),
        recentUsers,
      }
    }

    res.json(response)
  } catch (err) {
    next(err)
  }
})

router.get('/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const role = String(req.query.role || '').trim()

    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (role === 'USER' || role === 'ADMIN') {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        createdAt: true,
        _count: {
          select: { watchlist: true, history: true, profiles: true },
        },
        subscription: {
          include: { plan: true },
        },
      },
    })
    res.json({ users })
  } catch (err) {
    next(err)
  }
})

router.delete('/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const targetId = Number(req.params.id)
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' })
    }
    await prisma.user.delete({ where: { id: targetId } })
    res.json({ deleted: true, id: targetId })
  } catch (err) {
    next(err)
  }
})

const roleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

router.patch('/admin/users/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const targetId = Number(req.params.id)
    const { role } = roleSchema.parse(req.body)

    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role.' })
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })
    res.json({ user: updated })
  } catch (err) {
    next(err)
  }
})

export default router

import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const historySchema = z.object({
  movieId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  posterPath: z.string().nullable().optional(),
  backdropPath: z.string().nullable().optional(),
  progressPercent: z.number().int().min(1).max(100).default(25),
})

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.watchHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { watchedAt: 'desc' },
      take: 20,
    })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = historySchema.parse(req.body)
    const item = await prisma.watchHistory.upsert({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId: data.movieId,
        },
      },
      update: {
        title: data.title,
        posterPath: data.posterPath || null,
        backdropPath: data.backdropPath || null,
        progressPercent: data.progressPercent,
        watchedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        movieId: data.movieId,
        title: data.title,
        posterPath: data.posterPath || null,
        backdropPath: data.backdropPath || null,
        progressPercent: data.progressPercent,
      },
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
})

export default router

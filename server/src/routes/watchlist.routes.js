import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const movieItemSchema = z.object({
  movieId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  posterPath: z.string().nullable().optional(),
  backdropPath: z.string().nullable().optional(),
  voteAverage: z.number().optional().default(0),
  releaseDate: z.string().nullable().optional(),
})

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const payload = movieItemSchema.parse(req.body)

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId: payload.movieId,
        },
      },
    })

    if (existing) {
      await prisma.watchlistItem.delete({ where: { id: existing.id } })
      return res.json({ saved: false, movieId: payload.movieId })
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId: req.user.id,
        movieId: payload.movieId,
        title: payload.title,
        posterPath: payload.posterPath || null,
        backdropPath: payload.backdropPath || null,
        voteAverage: payload.voteAverage || 0,
        releaseDate: payload.releaseDate || null,
      },
    })

    res.status(201).json({ saved: true, item })
  } catch (err) {
    next(err)
  }
})

router.delete('/:movieId', async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId)
    await prisma.watchlistItem.deleteMany({
      where: { userId: req.user.id, movieId },
    })
    res.json({ saved: false, movieId })
  } catch (err) {
    next(err)
  }
})

export default router

import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { broadcastNotification } from '../lib/notifications.js'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase()
    const base = path
      .basename(file.originalname, safeExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40)
    cb(null, `${Date.now()}-${base}${safeExt}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max per file for local video uploads
  },
})

const movieUploadFields = upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'backdrop', maxCount: 1 },
  { name: 'video', maxCount: 1 },
])

const createMovieSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(255),
  tagline: z.string().trim().max(255).optional().default(''),
  overview: z.string().trim().min(10, 'Overview must be at least 10 characters.'),
  genres: z.string().trim().max(255).optional().default('Drama'),
  releaseYear: z.coerce.number().int().min(1900).max(2100).default(2026),
  runtimeMinutes: z.coerce.number().int().min(1).max(600).default(120),
  rating: z.coerce.number().min(0).max(10).default(8.2),
  maturityRating: z.string().trim().max(20).optional().default('PG-13'),
  videoQuality: z.string().trim().max(30).optional().default('4K HDR'),
  posterUrl: z.string().trim().max(500).optional().default(''),
  backdropUrl: z.string().trim().max(500).optional().default(''),
  videoUrl: z.string().trim().max(500).optional().default(''),
  isFeatured: z.union([z.boolean(), z.string()]).optional().transform((v) => v === true || v === 'true'),
  status: z.enum(['PUBLISHED', 'DRAFT']).optional().default('PUBLISHED'),
})

// Public: List published custom movies
router.get('/', async (_req, res, next) => {
  try {
    const movies = await prisma.customMovie.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({ movies })
  } catch (err) {
    next(err)
  }
})

// Admin: List all uploaded movies (published + draft)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { genres: { contains: search } },
          ],
        }
      : {}

    const movies = await prisma.customMovie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    res.json({ movies })
  } catch (err) {
    next(err)
  }
})

// Public: Get single custom movie details & increment view count
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid movie ID.' })
    }

    const movie = await prisma.customMovie.findUnique({ where: { id } })
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' })
    }

    await prisma.customMovie.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    res.json({ movie: { ...movie, views: movie.views + 1 } })
  } catch (err) {
    next(err)
  }
})

// Admin: Upload / create new movie (supports multipart files OR external URLs)
router.post('/', requireAuth, requireAdmin, movieUploadFields, async (req, res, next) => {
  try {
    const parsed = createMovieSchema.parse(req.body)

    const posterFile = req.files?.poster?.[0]
    const backdropFile = req.files?.backdrop?.[0]
    const videoFile = req.files?.video?.[0]

    const posterUrl = posterFile ? `/uploads/${posterFile.filename}` : parsed.posterUrl || null
    const backdropUrl = backdropFile
      ? `/uploads/${backdropFile.filename}`
      : parsed.backdropUrl || posterUrl
    const videoUrl = videoFile ? `/uploads/${videoFile.filename}` : parsed.videoUrl || null

    const movie = await prisma.customMovie.create({
      data: {
        title: parsed.title,
        tagline: parsed.tagline || null,
        overview: parsed.overview,
        genres: parsed.genres || 'Drama',
        releaseYear: parsed.releaseYear,
        runtimeMinutes: parsed.runtimeMinutes,
        rating: parsed.rating,
        maturityRating: parsed.maturityRating || 'PG-13',
        videoQuality: parsed.videoQuality || '4K HDR',
        posterUrl,
        backdropUrl,
        videoUrl,
        isFeatured: Boolean(parsed.isFeatured),
        status: parsed.status,
        uploadedById: req.user.id,
      },
    })

    if (movie.status === 'PUBLISHED') {
      await broadcastNotification({
        audience: 'ALL_USERS',
        type: 'NEW_MOVIE',
        title: `New Movie Added: ${movie.title}`,
        message: `${movie.title} (${movie.releaseYear}) is now streaming in ${movie.videoQuality}!`,
        link: `/originals/${movie.id}`,
      })
    }

    res.status(201).json({ movie })
  } catch (err) {
    next(err)
  }
})

// Admin: Update status or featured flag
router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const updateSchema = z.object({
      status: z.enum(['PUBLISHED', 'DRAFT']).optional(),
      isFeatured: z.boolean().optional(),
    })
    const data = updateSchema.parse(req.body)

    const movie = await prisma.customMovie.update({
      where: { id },
      data,
    })
    res.json({ movie })
  } catch (err) {
    next(err)
  }
})

// Admin: Delete uploaded movie
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await prisma.customMovie.delete({ where: { id } })
    res.json({ deleted: true, id })
  } catch (err) {
    next(err)
  }
})

export default router

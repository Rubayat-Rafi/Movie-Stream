import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(120),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
})

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  avatarColor: z.string().trim().max(20).optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.').max(100),
})

const createProfileSchema = z.object({
  name: z.string().trim().min(1, 'Profile name is required.').max(60),
  avatar: z.string().trim().max(40).default('crimson'),
  isKids: z.boolean().default(false),
})

async function buildUserResponse(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarColor: true,
      createdAt: true,
      profiles: {
        orderBy: { createdAt: 'asc' },
      },
      subscription: {
        include: { plan: true },
      },
    },
  })
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)
    const normalizedEmail = email.toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        profiles: {
          create: [{ name: name.split(' ')[0] || 'Viewer', avatar: 'crimson', isKids: false }],
        },
      },
    })

    const token = signToken(user)
    const fullUser = await buildUserResponse(user.id)

    res.status(201).json({ token, user: fullUser })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const normalizedEmail = email.toLowerCase()

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = signToken(user)
    const fullUser = await buildUserResponse(user.id)

    res.json({ token, user: fullUser })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const fullUser = await buildUserResponse(req.user.id)
    res.json({ user: fullUser })
  } catch (err) {
    next(err)
  }
})

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body)
    await prisma.user.update({
      where: { id: req.user.id },
      data,
    })
    const fullUser = await buildUserResponse(req.user.id)
    res.json({ user: fullUser })
  } catch (err) {
    next(err)
  }
})

router.patch('/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' })
    }
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    })
    res.json({ updated: true })
  } catch (err) {
    next(err)
  }
})

router.post('/profiles', requireAuth, async (req, res, next) => {
  try {
    const data = createProfileSchema.parse(req.body)
    const count = await prisma.profile.count({ where: { userId: req.user.id } })
    if (count >= 5) {
      return res.status(400).json({ error: 'Maximum of 5 viewer profiles per account.' })
    }
    const profile = await prisma.profile.create({
      data: {
        userId: req.user.id,
        ...data,
      },
    })
    res.status(201).json({ profile })
  } catch (err) {
    next(err)
  }
})

router.delete('/profiles/:profileId', requireAuth, async (req, res, next) => {
  try {
    const profileId = Number(req.params.profileId)
    const count = await prisma.profile.count({ where: { userId: req.user.id } })
    if (count <= 1) {
      return res.status(400).json({ error: 'You must keep at least 1 viewer profile.' })
    }
    await prisma.profile.deleteMany({
      where: { id: profileId, userId: req.user.id },
    })
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
})

export default router

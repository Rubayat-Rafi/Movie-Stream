import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { prisma } from './lib/prisma.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import campaignRoutes from './routes/campaign.routes.js'
import couponRoutes from './routes/coupon.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import historyRoutes from './routes/history.routes.js'
import marketingRoutes from './routes/marketing.routes.js'
import movieRoutes from './routes/movie.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import subscriptionRoutes from './routes/subscription.routes.js'
import watchlistRoutes from './routes/watchlist.routes.js'

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
    })
  }
})

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/watchlist', watchlistRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/movies', movieRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/marketing', marketingRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`StreamMovies API server running on http://localhost:${PORT}`)
})

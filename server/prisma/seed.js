import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const DEFAULT_PLANS = [
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Great video quality in HD (720p). Watch on 1 supported device at a time.',
    priceMonthly: 6.99,
    priceYearly: 67.0,
    videoQuality: 'Good',
    resolution: '720p (HD)',
    maxScreens: 1,
    downloadsEnabled: false,
    isPopular: false,
    features: [
      'Unlimited movies, trailers & recommendations',
      'Watch on 1 screen at a time',
      '720p HD streaming quality',
      'Cancel anytime with zero fees',
    ],
  },
  {
    name: 'Standard',
    slug: 'standard',
    description: 'Full HD (1080p) streaming on 2 devices simultaneously with offline downloads.',
    priceMonthly: 12.99,
    priceYearly: 124.0,
    videoQuality: 'Great',
    resolution: '1080p (Full HD)',
    maxScreens: 2,
    downloadsEnabled: true,
    isPopular: true,
    features: [
      'Everything in Basic',
      'Watch on 2 screens at the same time',
      '1080p Full HD crystal-clear quality',
      'Download on 2 supported devices',
    ],
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Our best 4K Ultra HD + HDR experience with Spatial Audio on 4 screens.',
    priceMonthly: 19.99,
    priceYearly: 191.0,
    videoQuality: 'Best',
    resolution: '4K (Ultra HD) + HDR',
    maxScreens: 4,
    downloadsEnabled: true,
    isPopular: false,
    features: [
      'Everything in Standard',
      'Watch on 4 screens simultaneously',
      '4K Ultra HD + HDR & Spatial Audio',
      'Download on up to 6 devices',
    ],
  },
]

export async function ensurePlansSeeded() {
  for (const plan of DEFAULT_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    })
  }
}

async function main() {
  console.log('Seeding StreamMovies MySQL database...')
  await ensurePlansSeeded()

  const premiumPlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: 'premium' },
  })
  const standardPlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: 'standard' },
  })

  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const demoPasswordHash = await bcrypt.hash('demo123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@streammovies.app' },
    update: { name: 'StreamMovies Admin', role: 'ADMIN' },
    create: {
      name: 'StreamMovies Admin',
      email: 'admin@streammovies.app',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatarColor: '#e11d48',
      profiles: {
        create: [{ name: 'Admin', avatar: 'crimson', isKids: false }],
      },
    },
  })

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@streammovies.app' },
    update: { name: 'Alex Mercer' },
    create: {
      name: 'Alex Mercer',
      email: 'demo@streammovies.app',
      passwordHash: demoPasswordHash,
      role: 'USER',
      avatarColor: '#2563eb',
      profiles: {
        create: [
          { name: 'Alex', avatar: 'crimson', isKids: false },
          { name: 'Kids', avatar: 'amber', isKids: true },
        ],
      },
    },
  })

  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + 30)

  if (premiumPlan) {
    await prisma.subscription.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        planId: premiumPlan.id,
        status: 'ACTIVE',
        billingCycle: 'YEARLY',
        currentPeriodEnd: periodEnd,
      },
    })
  }

  if (standardPlan) {
    await prisma.subscription.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        planId: standardPlan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        currentPeriodEnd: periodEnd,
      },
    })
  }

  const campaignCount = await prisma.emailCampaign.count()
  if (campaignCount === 0) {
    await prisma.emailCampaign.createMany({
      data: [
        {
          subject: 'Welcome to StreamMovies 4K HDR Experience',
          audience: 'ALL_USERS',
          body: 'Discover the top trending movies, build your watchlist, and enjoy 4K HDR streaming across your devices.',
          status: 'SENT',
          recipientCount: 2,
          openRate: 64.5,
          sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          createdById: adminUser.id,
        },
        {
          subject: 'This Weekend: Top 10 Trending Releases',
          audience: 'ACTIVE_SUBSCRIBERS',
          body: 'Here are the hottest movies streaming this weekend on StreamMovies. Jump right back in!',
          status: 'DRAFT',
          recipientCount: 2,
          openRate: 0,
          createdById: adminUser.id,
        },
      ],
    })
  }

  // Seed sample coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      usageLimit: 500,
      minOrderAmount: 0,
      applicablePlans: [],
      isActive: true,
    },
  })

  await prisma.coupon.upsert({
    where: { code: 'STREAM5' },
    update: {},
    create: {
      code: 'STREAM5',
      discountType: 'FIXED',
      discountValue: 5,
      usageLimit: 200,
      minOrderAmount: 10,
      applicablePlans: ['standard', 'premium'],
      isActive: true,
    },
  })

  // Seed initial update notifications if none exist
  const notifCount = await prisma.notification.count()
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: demoUser.id,
          type: 'PROMO',
          title: 'Use WELCOME20 for 20% Off!',
          message: 'Upgrade to Standard or Premium today and save 20% with coupon code WELCOME20.',
          link: '/pricing',
        },
        {
          userId: adminUser.id,
          type: 'UPDATE',
          title: 'Payment Gateway & Coupons Live',
          message: 'Manage promo coupons, view payment transactions, and broadcast update alerts from your Admin sidebar.',
          link: '/dashboard/coupons',
        },
      ],
    })
  }

  // Seed dynamic News Ticker & Promo Popup
  const tickerCount = await prisma.newsTicker.count()
  if (tickerCount === 0) {
    await prisma.newsTicker.createMany({
      data: [
        {
          badge: 'PROMO',
          text: 'Use coupon WELCOME20 at checkout for 20% off Standard & Premium plans!',
          link: '/pricing',
          isActive: true,
          priority: 10,
        },
        {
          badge: 'NEW',
          text: 'Explore Top 10 Trending Movies and watch official 4K trailers ad-free.',
          link: '/discover',
          isActive: true,
          priority: 5,
        },
      ],
    })
  }

  const popupCount = await prisma.promoPopup.count()
  if (popupCount === 0) {
    await prisma.promoPopup.create({
      data: {
        title: 'Unlock 4K HDR Streaming — 20% Off!',
        message:
          'Upgrade your StreamMovies membership today and save 20% with our welcome coupon code.',
        buttonText: 'View Plans',
        buttonLink: '/pricing',
        couponCode: 'WELCOME20',
        isActive: true,
        showOncePerSession: true,
      },
    })
  }

  console.log('Seed completed!')
  console.log('Admin login: admin@streammovies.app / admin123')
  console.log('Demo login:  demo@streammovies.app / demo123')
}

main()
  .catch((err) => {
    console.error('Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

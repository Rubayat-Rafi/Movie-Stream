import { prisma } from './prisma.js'

export async function notifyUser({ userId, type = 'UPDATE', title, message, link = null }) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  })
}

export async function broadcastNotification({
  audience = 'ALL_USERS',
  type = 'UPDATE',
  title,
  message,
  link = null,
}) {
  let where = {}
  if (audience === 'ACTIVE_SUBSCRIBERS') {
    where = { subscription: { is: { status: 'ACTIVE' } } }
  } else if (audience === 'FREE_USERS') {
    where = { subscription: { is: null } }
  } else if (audience === 'PREMIUM_USERS') {
    where = { subscription: { is: { status: 'ACTIVE', plan: { slug: 'premium' } } } }
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  })

  if (users.length === 0) return { count: 0 }

  const result = await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      title,
      message,
      link,
    })),
  })

  return { count: result.count }
}

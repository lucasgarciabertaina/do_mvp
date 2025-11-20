import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth' // tu helper

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  console.log('Subscribing push for user:', user)
  const sub = await req.json()
  const { endpoint, keys } = sub
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.userId },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.userId },
  })
  return NextResponse.json({ ok: true })
}

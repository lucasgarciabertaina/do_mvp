import webpush from 'web-push'
import prisma from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function pushToUser(userId: string, payload: any) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return { sent: 0 }

  const json = JSON.stringify(payload)
  const bad: string[] = []

  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any,
      json
    ))
  )

  results.forEach((r, i) => { if (r.status === 'rejected') bad.push(subs[i].endpoint) })
  if (bad.length) await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: bad } } })
  return { sent: subs.length - bad.length, removed: bad.length }
}

export async function broadcast(payload: any) {
  const subs = await prisma.pushSubscription.findMany({ select: { endpoint: true, p256dh: true, auth: true } })
  const json = JSON.stringify(payload)
  const bad: string[] = []
  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, json))
  )
  results.forEach((r,i)=>{ if (r.status==='rejected') bad.push(subs[i].endpoint) })
  if (bad.length) await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: bad } } })
  return { sent: subs.length - bad.length, removed: bad.length }
}

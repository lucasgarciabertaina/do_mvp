import { NextRequest, NextResponse } from 'next/server'
import { pushToUser } from '@/lib/push'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('HEADERS:', Object.fromEntries(req.headers.entries()));
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lastEvent = await prisma.event.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, username: true, direction: true } }, // dueño del evento
      buyer: { select: { id: true, name: true, username: true, direction: true } }, // comprador asignado
    }
  });

  console.log("Current event:", lastEvent)
  const res = await pushToUser(user.userId, {
    title: 'Para que no se olviden 🔔',
    body: `Maniana es la penia en la casa de ${lastEvent?.owner?.username || 'desconocido'}! 🎉`,
    data: { url: '/evento/actual' }
  })
  return NextResponse.json(res)
}

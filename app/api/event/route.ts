import {  NextResponse } from 'next/server'
import {  getCurrentUser } from '@/lib/auth'
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lastEvent = await prisma.event.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, username: true, direction: true } }, // dueño del evento
        buyer: { select: { id: true, name: true, username: true, direction: true } }, // comprador asignado
        reservations: {
          include: {
            user: { select: { id: true, name: true, username: true, direction: true } }
          }
        },
        dateOptions: true,
       }
    });

    return NextResponse.json(lastEvent)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

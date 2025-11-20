import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    console.log("Current User:", user)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { status, eventId } = await request.json()

    const reservation = await prisma.reservation.create({
      data: {
        eventId: eventId,
        userId: user.userId,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({
      id: reservation.id,
      status: reservation.status,
      eventId: reservation.eventId,
      userId: reservation.userId,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      user: reservation.user ? { name: reservation.user.name ?? null } : null,
    })
  } catch (error){
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

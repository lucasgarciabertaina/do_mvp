import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { content, eventId } = await request.json()

    const message = await prisma.message.create({
      data: {
        eventId: eventId,
        userId: user.userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({
      id: message.id,
      content: message.content,
      eventId: message.eventId,
      userId: message.userId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      user: message.user ? { name: message.user.name ?? null } : null,
    })
  } catch (error){
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

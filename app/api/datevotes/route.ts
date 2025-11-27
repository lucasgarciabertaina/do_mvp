import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { NextRequest } from 'next/server';
export const dynamic = "force-dynamic";
export const revalidate = 0;

const createVoteSchema = z.object({
  dateOptionId: z.string().min(1),
  eventId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, dateOptionId } = createVoteSchema.parse(body)

  
    const vote = await prisma.dateVote.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: user.userId,
        },
      },
      update: {
        dateOptionId,
      },
      create: {
        eventId,
        dateOptionId,
        userId: user.userId,
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({
      id: vote.id,
      eventId: vote.eventId,
      userId: vote.userId,
      dateOptionId: vote.dateOptionId,
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt,
      user: vote.user ? { name: vote.user.name ?? null } : null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const voteWithUser = await prisma.dateVote.findMany({
      where: {
        eventId : params.eventId,
      },
      include: {
        user: { select: { name: true } },
      }
    })

    return NextResponse.json(
      voteWithUser,
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store'}
      }
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500,
        headers: { 'Cache-Control': 'no-store'}
      }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server';
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {date} = await request.json()
    const udpatedEvent = await prisma.event.update({
      where: { id: params.eventId },
      data: { date },
    });

    return NextResponse.json(udpatedEvent)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

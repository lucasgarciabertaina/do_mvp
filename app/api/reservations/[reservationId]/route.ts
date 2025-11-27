import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server';
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(request: NextRequest, { params }: { params: { reservationId: string } }) {
  try {

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { status } = await request.json()

    const updatedReservation = await prisma.reservation.update({
      where: { id: params.reservationId },
      data: { status },
    })

    return NextResponse.json(updatedReservation)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




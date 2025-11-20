import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { mockExpenses, mockUsers } from '@/lib/mockData'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { NextRequest } from 'next/server';
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {

    console.log("Event ID:", params.eventId)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const expensesWithUser = await prisma.expense.findMany({
      where: {
        eventId : params.eventId,
      },
      include: {
        user: { select: { name: true } },
      }
    })

    return NextResponse.json(expensesWithUser)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
export const dynamic = "force-dynamic";
export const revalidate = 0;

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  eventId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    console.log('HEADERS:', Object.fromEntries(request.headers.entries()));
    const user = await getCurrentUser()
    console.log("Current User:", user)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request Body:", body)
    const { description, amount, eventId } = createExpenseSchema.parse(body)

  
    const expense = await prisma.expense.create({
      data: {
        description,
        eventId,
        amount,            
        userId: user.userId,
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({
      id: expense.id,
      eventId: expense.eventId,
      userId: expense.userId,
      description: expense.description,
      amount: Number(expense.amount),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      user: expense.user ? { name: expense.user.name ?? null } : null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

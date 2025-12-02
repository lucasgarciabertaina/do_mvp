import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(request: NextRequest, { params }: { params: { expenseId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const deletedExpense = await prisma.expense.delete({
      where: { id: params.expenseId },
    });

    return NextResponse.json(deletedExpense)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




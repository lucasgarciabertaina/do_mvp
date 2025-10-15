import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { mockExpenses, mockUsers } from '@/lib/mockData'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return expenses with user info
    const expensesWithUser = mockExpenses.map(expense => {
      const expenseUser = mockUsers.find(u => u.id === expense.userId)
      return {
        ...expense,
        user: expenseUser ? { name: expenseUser.name } : null,
      }
    })

    return NextResponse.json(expensesWithUser)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { description, amount } = await request.json()

    const newExpense = {
      id: `expense${mockExpenses.length + 1}`,
      occurrenceId: 'occurrence1',
      userId: user.userId,
      description,
      amount: parseFloat(amount),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockExpenses.push(newExpense)

    const expenseUser = mockUsers.find(u => u.id === user.userId)
    return NextResponse.json({
      ...newExpense,
      user: expenseUser ? { name: expenseUser.name } : null,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

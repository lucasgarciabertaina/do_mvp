import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { mockMessages, mockUsers } from '@/lib/mockData'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return messages with user info
    const messagesWithUser = mockMessages.map(message => {
      const messageUser = mockUsers.find(u => u.id === message.userId)
      return {
        ...message,
        user: messageUser ? { name: messageUser.name } : null,
      }
    })

    return NextResponse.json(messagesWithUser)
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

    const { content } = await request.json()

    const newMessage = {
      id: `message${mockMessages.length + 1}`,
      occurrenceId: 'occurrence1',
      userId: user.userId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockMessages.push(newMessage)

    const messageUser = mockUsers.find(u => u.id === user.userId)
    return NextResponse.json({
      ...newMessage,
      user: messageUser ? { name: messageUser.name } : null,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

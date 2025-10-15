import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie } from '@/lib/auth'
import { mockUsers } from '@/lib/mockData'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Simple authentication: username = password
    if (username !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Find user in mock data
    const user = mockUsers.find(u => u.username === username)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Set auth cookie
    await setAuthCookie(user.id)

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      }
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

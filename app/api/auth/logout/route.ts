import { NextResponse } from 'next/server'
import { deleteAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await deleteAuthCookie()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // If no token and trying to access protected route, redirect to login
  if (!token && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, verify it
  if (token) {
    const payload = await verifyToken(token)
    
    // If token is invalid and trying to access protected route, redirect to login
    if (!payload && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // If token is valid and trying to access login, redirect to home
    if (payload && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login'],
}

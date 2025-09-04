import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/leads', '/followups', '/import', '/settings']
const PUBLIC_PATHS = ['/login', '/onboarding', '/manifest.json', '/sw.js']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Skip static files and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    PUBLIC_PATHS.some(p => pathname.startsWith(p))
  ) return NextResponse.next()

  const hasAuth = Boolean(req.cookies.get('sb-access-token')?.value)

  // If hitting /login while authenticated → go to dashboard
  if (pathname === '/login' && hasAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If hitting protected route while not authenticated → go to login
  if (PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) && !hasAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api).*)']
}


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths always allowed; we handle auth inside pages to avoid loops
const PUBLIC_PATHS = ['/onboarding', '/auth/callback', '/manifest.json', '/sw.js']

export function middleware(req: NextRequest) {
  // Skip auth gating during E2E runs
  if (process.env.E2E === '1') return NextResponse.next()
  const { pathname } = req.nextUrl
  const hasAuth = Boolean(req.cookies.get('sb-access-token')?.value)

  // If hitting /login while authenticated → go to dashboard
  if (pathname === '/login' && hasAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Skip static files and Next internals (but not /login case handled above)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    PUBLIC_PATHS.some(p => pathname.startsWith(p))
  ) return NextResponse.next()

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api).*)']
}

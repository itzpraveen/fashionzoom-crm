import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = createServerSupabase()
    // This will set the auth cookies via our server client cookie adapter
    await supabase.auth.exchangeCodeForSession(code)
  }

  // After setting cookies, continue to onboarding which bootstraps profile (or skips if present)
  const url = new URL('/onboarding', request.url)
  url.searchParams.set('redirect', redirect)
  return NextResponse.redirect(url)
}


import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { bootstrapProfile } from '@/actions/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = createServerSupabase()
    // This will set the auth cookies via our server client cookie adapter
    await supabase.auth.exchangeCodeForSession(code)
    // Ensure profile exists so the app can route without an extra onboarding step
    try {
      await bootstrapProfile()
    } catch {
      // If bootstrapping fails (e.g., missing service key), allow navigation anyway
    }
  } else {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'Missing or invalid login code. Please request a new magic link.')
    return NextResponse.redirect(url)
  }

  // After setting cookies (and bootstrapping), continue to the requested page
  const url = new URL(redirect, request.url)
  return NextResponse.redirect(url)
}

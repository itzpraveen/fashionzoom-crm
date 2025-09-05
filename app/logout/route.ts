import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createServerSupabase()
  // Clear Supabase auth cookies
  await supabase.auth.signOut()
  const url = new URL('/login', request.url)
  return NextResponse.redirect(url)
}

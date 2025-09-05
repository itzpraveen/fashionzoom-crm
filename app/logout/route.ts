import { NextResponse } from 'next/server'
import { createMutableServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createMutableServerSupabase()
  // Clear Supabase auth cookies
  await supabase.auth.signOut()
  const url = new URL('/login', request.url)
  return NextResponse.redirect(url)
}

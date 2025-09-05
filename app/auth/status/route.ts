import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const cookieStore = cookies()
  const hdrs = headers()
  const supabase = createServerSupabase()
  const [{ data: userRes }, { data: sessionRes }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession?.() ?? Promise.resolve({ data: null } as any),
  ])
  const { data: profile } = userRes?.user
    ? await supabase.from('profiles').select('id, role, team_id, full_name, updated_at').eq('id', userRes.user.id).maybeSingle()
    : { data: null }

  const cookieList = cookieStore.getAll().map(c => ({ name: c.name, valuePreview: (c.value || '').slice(0, 12), domain: (hdrs.get('host') || ''), path: '/', size: (c.value || '').length }))
  const out = {
    now: new Date().toISOString(),
    requestHost: hdrs.get('host'),
    referer: hdrs.get('referer') || null,
    user: userRes?.user ? { id: userRes.user.id, email: userRes.user.email } : null,
    session: sessionRes?.session ? { expires_at: sessionRes.session.expires_at } : null,
    profile: profile || null,
    cookies: cookieList,
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      pwa: process.env.NEXT_PUBLIC_ENABLE_PWA || '0',
    }
  }
  return NextResponse.json(out, { status: 200 })
}


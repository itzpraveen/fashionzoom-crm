import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'
import { cachedQuery } from '@/lib/cache/query-cache'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request) {
  const hdrs = headers()
  const supabase = createServerSupabase()
  const { data: userRes } = await supabase.auth.getUser()

  // Cache profile lookup briefly per user to avoid repeated DB hits on nav
  const profile = userRes?.user
    ? await cachedQuery(
        `auth-status:${userRes.user.id}`,
        async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, role, team_id, full_name, updated_at')
            .eq('id', userRes.user!.id)
            .maybeSingle()
          return data
        },
        10000
      )
    : null

  const cookieList = cookies().getAll().map(c => ({ name: c.name, len: (c.value || '').length }))
  const out = {
    now: new Date().toISOString(),
    host: hdrs.get('host'),
    user: userRes?.user ? { id: userRes.user.id, email: userRes.user.email } : null,
    profile: profile || null,
    cookies: cookieList,
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      pwa: process.env.NEXT_PUBLIC_ENABLE_PWA || '0',
    }
  }
  return NextResponse.json(out, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
    }
  })
}

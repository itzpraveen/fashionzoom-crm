import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabase()
    const { data: userRes } = await supabase.auth.getUser()
    if (!userRes?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, team_id, full_name')
      .eq('id', userRes.user.id)
      .maybeSingle()

    let hasAdmin: boolean | null = null
    let serviceConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceConfigured) {
      try {
        const admin = getAdminClient()
        const { data, error } = await admin
          .from('profiles')
          .select('id')
          .eq('role', 'ADMIN')
          .limit(1)
        if (error) throw error
        hasAdmin = !!(data && data.length > 0)
      } catch (_e) {
        hasAdmin = null
        serviceConfigured = false
      }
    }

    return NextResponse.json({
      ok: true,
      user: { id: userRes.user.id, email: userRes.user.email },
      profile: profile || null,
      hasAdmin,
      serviceConfigured
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'internal' }, { status: 500 })
  }
}


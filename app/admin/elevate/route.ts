import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Safe self-elevation: promotes the current user to ADMIN only if there are no admins yet.
// Does not require a token, but requires the caller to be logged in and the server to be
// configured with SUPABASE_SERVICE_ROLE_KEY. No secrets are leaked in responses.
export async function GET() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  if (process.env.NEXT_PUBLIC_DEMO === '1') {
    const { upsertRow } = await import('@/lib/demo/store')
    upsertRow('profiles', { id: user.id, role: 'ADMIN' }, 'id', false)
    return NextResponse.json({ ok: true, userId: user.id })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Server missing service key' }, { status: 500 })
  }

  // Check if an admin already exists
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  const existing = await fetch(`${url}/rest/v1/profiles?role=eq.ADMIN&select=id&limit=1`, { headers })
  if (!existing.ok) {
    const text = await existing.text().catch(() => '')
    return NextResponse.json({ ok: false, error: text || 'Admin check failed' }, { status: 500 })
  }
  const rows: any[] = await existing.json().catch(() => [])
  if (Array.isArray(rows) && rows.length > 0) {
    return NextResponse.json({ ok: false, error: 'Admin already exists' }, { status: 403 })
  }

  // Elevate current user
  const up = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: user.id, role: 'ADMIN' })
  })
  if (!up.ok) {
    const text = await up.text().catch(() => '')
    return NextResponse.json({ ok: false, error: text || 'Failed to set admin role' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, userId: user.id })
}


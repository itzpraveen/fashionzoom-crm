"use server"
import { createServerSupabase } from '@/lib/supabase/server'

// Ensures a profile row exists for the signed-in user.
// Uses service-role to bypass RLS safely on the server.
export async function bootstrapProfile(input?: { full_name?: string; role?: 'TELECALLER'|'MANAGER'|'ADMIN' }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Demo mode: upsert into in-memory store
  if (process.env.NEXT_PUBLIC_DEMO === '1') {
    const { getTable, upsertRow } = await import('@/lib/demo/store')
    const profiles = getTable('profiles')
    const payload: any = {
      id: user.id,
      full_name: input?.full_name ?? (user as any)?.user_metadata?.name ?? 'Demo User',
      role: input?.role ?? 'TELECALLER'
    }
    upsertRow('profiles', payload, 'id', false)
    return { ok: true }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing server credentials')

  const payload = {
    id: user.id,
    full_name: input?.full_name ?? (user.user_metadata as any)?.name ?? null,
    role: input?.role ?? 'TELECALLER',
  }

  const resp = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(payload)
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(text || 'Failed to bootstrap profile')
  }
  return { ok: true }
}

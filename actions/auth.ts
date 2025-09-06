"use server"
import { createServerSupabase } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

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

  const admin = getAdminClient()
  // Read existing profile first to avoid downgrading an elevated role
  const existing = await admin.from('profiles').select('id,role,full_name').eq('id', user.id).maybeSingle()
  if (existing.data) {
    const desiredName = input?.full_name ?? (user.user_metadata as any)?.name ?? null
    if (!existing.data.full_name && desiredName) {
      await admin.from('profiles').update({ full_name: desiredName }).eq('id', user.id)
    }
    return { ok: true }
  }
  // Create fresh profile with default role (or provided) only if missing
  await admin.from('profiles').upsert({
    id: user.id,
    full_name: input?.full_name ?? (user.user_metadata as any)?.name ?? null,
    role: input?.role ?? 'TELECALLER',
  }, { onConflict: 'id' })
  return { ok: true }
}

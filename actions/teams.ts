"use server"
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile?.role ?? 'TELECALLER') !== 'ADMIN') throw new Error('Forbidden')
  return { supabase, user }
}

export async function createTeam(input: { name: string }) {
  const { supabase } = await assertAdmin()
  const data = z.object({ name: z.string().min(2) }).parse(input)
  const { error } = await supabase.from('teams').insert({ name: data.name })
  if (error) throw error
  return { ok: true }
}

export async function assignUserToTeam(input: { email?: string; userId?: string; teamId: string; role?: 'TELECALLER'|'MANAGER'|'ADMIN' }) {
  await assertAdmin()
  const { email, userId, teamId, role } = z.object({
    email: z.string().email().optional(),
    userId: z.string().uuid().optional(),
    teamId: z.string().uuid(),
    role: z.enum(['TELECALLER','MANAGER','ADMIN']).optional()
  }).parse(input)

  let uid = userId ?? null
  if (!uid && email) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error('Service key missing')
    const resp = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    })
    if (resp.ok) {
      const json: any = await resp.json().catch(() => null)
      uid = json?.users?.[0]?.id ?? null
    }
  }
  if (!uid) throw new Error('User not found. Provide a valid email or user ID.')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const payload: any = { id: uid, team_id: teamId }
  if (role) payload.role = role
  const r = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('Failed to assign user')
  return { ok: true }
}


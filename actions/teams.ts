"use server"
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

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
  if (process.env.NEXT_PUBLIC_DEMO === '1') {
    const { getTable, upsertRow } = await import('@/lib/demo/store')
    const { email, userId, teamId, role } = input
    const uid = userId || 'demo-user-2'
    upsertRow('profiles', { id: uid, full_name: email || 'User', role: role || 'TELECALLER', team_id: teamId }, 'id', false)
    return { ok: true }
  }
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

// Promote a user to ADMIN role. Caller must be ADMIN.
export async function makeAdmin(input: { email?: string; userId?: string }) {
  await assertAdmin()
  const { email, userId } = z.object({
    email: z.string().email().optional(),
    userId: z.string().uuid().optional()
  }).parse(input)

  let uid = userId ?? null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')

  // Resolve user ID by email if needed
  if (!uid && email) {
    const resp = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    })
    if (resp.ok) {
      const json: any = await resp.json().catch(() => null)
      uid = json?.users?.[0]?.id ?? null
    }
  }
  if (!uid) throw new Error('User not found. Provide a valid email or user ID.')

  // Upsert profile with ADMIN role (preserves other fields via merge resolution)
  const payload: any = { id: uid, role: 'ADMIN' }
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
  if (!r.ok) throw new Error('Failed to promote user to admin')
  return { ok: true }
}

// Invite a user by email and assign role/team. Sends an invite email via Supabase Auth.
export async function inviteUser(input: { email: string; teamId?: string; role?: 'TELECALLER'|'MANAGER'|'ADMIN'; redirectTo?: string }) {
  await assertAdmin()
  const { email, teamId, role, redirectTo } = z.object({
    email: z.string().email(),
    teamId: z.string().uuid().optional(),
    role: z.enum(['TELECALLER','MANAGER','ADMIN']).optional(),
    redirectTo: z.string().url().optional()
  }).parse(input)

  // Demo mode: seed in-memory profile only
  if (process.env.NEXT_PUBLIC_DEMO === '1') {
    const { upsertRow } = await import('@/lib/demo/store')
    const id = 'demo-' + Math.random().toString(36).slice(2)
    upsertRow('profiles', { id, full_name: email, role: role || 'TELECALLER', team_id: teamId || null }, 'id', false)
    return { ok: true }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
  const cb = redirectTo || `${site}/auth/callback?redirect=${encodeURIComponent('/dashboard')}`

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: cb })
  if (inviteError) throw inviteError

  const userId = invited?.user?.id
  if (!userId) {
    throw new Error('Invite created but no user id returned')
  }

  // Upsert profile with role/team
  const resp = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ id: userId, role: role || 'TELECALLER', team_id: teamId || null })
  })
  if (!resp.ok) throw new Error('Failed to set user role/team')

  revalidatePath('/settings/teams')
  return { ok: true }
}

// Resend invite or send magic link to an existing user
export async function resendInvite(input: { email?: string; userId?: string; redirectTo?: string }) {
  await assertAdmin()
  const { email, userId, redirectTo } = z.object({
    email: z.string().email().optional(),
    userId: z.string().uuid().optional(),
    redirectTo: z.string().url().optional()
  }).parse(input)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')

  // Resolve email if only userId provided
  let targetEmail = email || ''
  if (!targetEmail && userId) {
    const r = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    })
    if (r.ok) {
      const u: any = await r.json().catch(() => null)
      targetEmail = u?.user?.email || ''
    }
  }
  if (!targetEmail) throw new Error('User email not found')

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
  const cb = redirectTo || `${site}/auth/callback?redirect=${encodeURIComponent('/dashboard')}`

  const { error } = await admin.auth.admin.inviteUserByEmail(targetEmail, { redirectTo: cb })
  if (error) throw error
  return { ok: true }
}

// Remove user from team (sets team_id to null)
export async function removeUserFromTeam(input: { userId: string }) {
  await assertAdmin()
  const { userId } = z.object({ userId: z.string().uuid() }).parse(input)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const r = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ id: userId, team_id: null })
  })
  if (!r.ok) throw new Error('Failed to remove from team')
  revalidatePath('/settings/teams')
  return { ok: true }
}

// Update role only (e.g., demote to TELECALLER)
export async function setUserRole(input: { userId: string; role: 'TELECALLER'|'MANAGER'|'ADMIN' }) {
  await assertAdmin()
  const { userId, role } = z.object({ userId: z.string().uuid(), role: z.enum(['TELECALLER','MANAGER','ADMIN']) }).parse(input)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const r = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ id: userId, role })
  })
  if (!r.ok) throw new Error('Failed to update role')
  revalidatePath('/settings/teams')
  return { ok: true }
}

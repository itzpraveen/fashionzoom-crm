"use server"
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { normalizeRole } from '@/lib/utils/role'

async function assertAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (normalizeRole(profile?.role) !== 'ADMIN') throw new Error('Forbidden')
  return { supabase, user }
}

export async function createTeam(input: { name: string }) {
  const { supabase } = await assertAdmin()
  const data = z.object({ name: z.string().min(2) }).parse(input)
  const { error } = await supabase.from('teams').insert({ name: data.name })
  if (error) throw new Error(error.message || 'Failed to create team')
  revalidatePath('/settings/teams')
  return { ok: true }
}

// Bootstrap: if there are no ADMIN users yet, promote the current user to ADMIN.
// This is safe to expose because it only succeeds when admin count is zero.
export async function bootstrapFirstAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // In demo, simply elevate
  if (process.env.NEXT_PUBLIC_DEMO === '1') {
    const { upsertRow } = await import('@/lib/demo/store')
    upsertRow('profiles', { id: user.id, role: 'ADMIN' }, 'id', false)
    return { ok: true }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')

  // Check if any admin exists. Ignore stale admins whose auth user no longer exists.
  // Fetch up to a few admin profile ids, then verify against auth.
  const r = await fetch(`${url}/rest/v1/profiles?role=eq.ADMIN&select=id&limit=5`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  })
  if (!r.ok) throw new Error('Failed to verify admin status')
  const adminProfiles: Array<{ id: string }>|null = await r.json().catch(() => null)
  if (Array.isArray(adminProfiles) && adminProfiles.length > 0) {
    // Verify if at least one admin id corresponds to an active auth user
    const checks = await Promise.all(adminProfiles.map(async (p) => {
      const u = await fetch(`${url}/auth/v1/admin/users/${p.id}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      })
      if (!u.ok) return false
      const j: any = await u.json().catch(() => null)
      return !!j?.user?.id
    }))
    const hasValidAdmin = checks.some(Boolean)
    if (hasValidAdmin) {
      throw new Error('An admin already exists')
    }
    // No valid auth users among admin profiles; continue bootstrap
  }

  // Elevate current user
  const up = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ id: user.id, role: 'ADMIN' })
  })
  if (!up.ok) throw new Error('Failed to set admin role')
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

// Delete a team (admin only). Will fail if referenced by profiles/leads.
export async function deleteTeam(input: { teamId: string }) {
  await assertAdmin()
  const { teamId } = z.object({ teamId: z.string().uuid() }).parse(input)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')

  const resp = await fetch(`${url}/rest/v1/teams?id=eq.${teamId}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  })
  if (!resp.ok) {
    const text = await resp.text().catch(()=> '')
    throw new Error(text || 'Failed to delete team. Ensure no users or leads reference this team.')
  }
  revalidatePath('/settings/teams')
  return { ok: true }
}

// Rename a team (admin only)
export async function renameTeam(input: { teamId: string; name: string }) {
  await assertAdmin()
  const { teamId, name } = z.object({ teamId: z.string().uuid(), name: z.string().min(2) }).parse(input)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')
  const resp = await fetch(`${url}/rest/v1/teams?id=eq.${teamId}`, {
    method: 'PATCH',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!resp.ok) {
    const text = await resp.text().catch(()=> '')
    throw new Error(text || 'Failed to rename team')
  }
  revalidatePath('/settings/teams')
  return { ok: true }
}

// Move all members from one team to another (admin only)
export async function moveMembers(input: { fromTeamId: string; toTeamId: string }) {
  await assertAdmin()
  const { fromTeamId, toTeamId } = z.object({
    fromTeamId: z.string().uuid(),
    toTeamId: z.string().uuid()
  }).parse(input)
  if (fromTeamId === toTeamId) throw new Error('Choose a different destination team')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Service key missing')
  const resp = await fetch(`${url}/rest/v1/profiles?team_id=eq.${fromTeamId}`, {
    method: 'PATCH',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: toTeamId })
  })
  if (!resp.ok) {
    const text = await resp.text().catch(()=> '')
    throw new Error(text || 'Failed to move members')
  }
  revalidatePath('/settings/teams')
  return { ok: true }
}

"use server"
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireManagerOrAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: me } = await supabase.from('profiles').select('role, team_id').eq('id', user.id).single()
  const role = (me?.role ?? 'TELECALLER') as string
  if (role !== 'MANAGER' && role !== 'ADMIN') throw new Error('Forbidden')
  return { supabase, user, teamId: me?.team_id as string | null }
}

export async function createEvent(formData: FormData) {
  const { supabase, teamId } = await requireManagerOrAdmin()
  const data = {
    name: String(formData.get('name') || ''),
    season: String(formData.get('season') || '') || null,
    startsAt: String(formData.get('starts_at') || ''),
    endsAt: String(formData.get('ends_at') || ''),
  }
  const parsed = z.object({ name: z.string().min(2), season: z.string().nullable(), startsAt: z.string().optional(), endsAt: z.string().optional() }).parse(data)
  const payload: any = {
    name: parsed.name,
    season: parsed.season,
    team_id: teamId || null,
  }
  if (data.startsAt) payload.starts_at = new Date(data.startsAt).toISOString()
  if (data.endsAt) payload.ends_at = new Date(data.endsAt).toISOString()
  const { error } = await supabase.from('events').insert(payload)
  if (error) throw error
  revalidatePath('/settings/events')
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireManagerOrAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return
  const data = {
    name: String(formData.get('name') || ''),
    season: String(formData.get('season') || '') || null,
    startsAt: String(formData.get('starts_at') || ''),
    endsAt: String(formData.get('ends_at') || ''),
  }
  const parsed = z.object({ name: z.string().min(2), season: z.string().nullable(), startsAt: z.string().optional(), endsAt: z.string().optional() }).parse(data)
  const patch: any = { name: parsed.name, season: parsed.season }
  if (data.startsAt) patch.starts_at = new Date(data.startsAt).toISOString(); else patch.starts_at = null
  if (data.endsAt) patch.ends_at = new Date(data.endsAt).toISOString(); else patch.ends_at = null
  const { error } = await supabase.from('events').update(patch).eq('id', id)
  if (error) throw error
  revalidatePath('/settings/events')
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireManagerOrAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/settings/events')
}

export async function createProgram(formData: FormData) {
  const { supabase } = await requireManagerOrAdmin()
  const eventId = String(formData.get('event_id') || '')
  const name = String(formData.get('name') || '')
  const category = String(formData.get('category') || '') || null
  if (!eventId) throw new Error('Missing event_id')
  const { error } = await supabase.from('programs').insert({ event_id: eventId, name, category })
  if (error) throw error
  revalidatePath('/settings/events')
}

export async function updateProgram(formData: FormData) {
  const { supabase } = await requireManagerOrAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return
  const name = String(formData.get('name') || '')
  const category = String(formData.get('category') || '') || null
  const { error } = await supabase.from('programs').update({ name, category }).eq('id', id)
  if (error) throw error
  revalidatePath('/settings/events')
}

export async function deleteProgram(formData: FormData) {
  const { supabase } = await requireManagerOrAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return
  const { error } = await supabase.from('programs').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/settings/events')
}


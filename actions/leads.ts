"use server"
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { simpleLeadScore } from '@/lib/phone'

const rateLimiter = new Map<string, { count: number; ts: number }>()
function limit(key: string, windowMs = 5000, max = 20) {
  const now = Date.now()
  const rec = rateLimiter.get(key)
  if (!rec || now - rec.ts > windowMs) {
    rateLimiter.set(key, { count: 1, ts: now })
    return
  }
  rec.count++
  if (rec.count > max) throw new Error('Too many requests, slow down')
}

export const saveDisposition = async (input: {
  leadId: string
  outcome: 'CONNECTED'|'NO_ANSWER'|'BUSY'|'WRONG_NUMBER'|'NOT_INTERESTED'|'INTERESTED'|'APPOINTMENT_SET'
  note?: string
  nextFollowUpAt: string | null
  priority: 'LOW'|'MEDIUM'|'HIGH'
}) => {
  const schema = z.object({
    leadId: z.string().uuid(),
    outcome: z.enum(['CONNECTED','NO_ANSWER','BUSY','WRONG_NUMBER','NOT_INTERESTED','INTERESTED','APPOINTMENT_SET']),
    note: z.string().optional(),
    nextFollowUpAt: z.string().datetime().nullable(),
    priority: z.enum(['LOW','MEDIUM','HIGH'])
  })
  const data = schema.parse(input)
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  limit(user.id)

  // Insert activity
  const { data: act, error } = await supabase.from('activities').insert({
    lead_id: data.leadId,
    user_id: user.id,
    type: 'CALL',
    outcome: data.outcome,
    message: data.note || null,
  }).select('*').single()
  if (error) throw error

  // Create follow-up if provided
  if (data.nextFollowUpAt) {
    await supabase.from('followups').insert({
      lead_id: data.leadId,
      user_id: user.id,
      due_at: data.nextFollowUpAt,
      priority: data.priority,
      remark: data.note || null
    })
  }
  // Update lead summary (activity trigger already bumps last_activity_at)
  await supabase.from('leads').update({
    status: data.outcome === 'CONNECTED' ? 'CONTACTED' : 'FOLLOW_UP',
  }).eq('id', data.leadId)
  return act
}

export const createFollowup = async (input: { leadId: string; dueAt: string; priority: 'LOW'|'MEDIUM'|'HIGH'; remark?: string }) => {
  const schema = z.object({
    leadId: z.string().uuid(),
    dueAt: z.string().datetime(),
    priority: z.enum(['LOW','MEDIUM','HIGH']),
    remark: z.string().optional()
  })
  const data = schema.parse(input)
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  limit(user.id)
  await supabase.from('followups').insert({ lead_id: data.leadId, user_id: user.id, due_at: data.dueAt, priority: data.priority, remark: data.remark || null })
}

export const updateLead = async (input: { id: string; patch: Record<string, unknown> }) => {
  const schema = z.object({ id: z.string().uuid(), patch: z.record(z.unknown()) })
  const { id, patch } = schema.parse(input)
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  limit(user.id)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile?.role ?? 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'

  const baseAllowed = new Set([
    'full_name', 'city', 'address', 'pincode', 'status', 'product_interest', 'tags', 'notes', 'consent', 'next_follow_up_at', 'email', 'alt_phone'
  ])
  const elevatedAllowed = new Set([
    'owner_id', 'team_id', 'score', 'duplicate_of_lead_id', 'is_deleted'
  ])

  const allowed = new Set([...baseAllowed, ...(role === 'ADMIN' || role === 'MANAGER' ? elevatedAllowed : [])])
  const filtered: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (allowed.has(k)) filtered[k] = v
  }
  if (Object.keys(filtered).length === 0) return
  await supabase.from('leads').update(filtered).eq('id', id)
}

export const importLeads = async (rows: Array<{ full_name: string; primary_phone: string; city?: string; source?: string }>) => {
  const rowSchema = z.object({
    full_name: z.string().min(1),
    primary_phone: z.string().min(5),
    city: z.string().optional(),
    source: z.string().optional()
  })
  const data = z.array(rowSchema).parse(rows)
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  limit(user.id, 10000, 200) // higher window for imports

  // batch upsert by normalized phone; ignore duplicates for speed
  const chunk = <T,>(arr: T[], size: number) => arr.reduce<T[][]>((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), [])
  let inserted = 0
  const chunks = chunk(data, 500)
  for (const c of chunks) {
    const payload = c.map(r => ({
      full_name: r.full_name,
      primary_phone: r.primary_phone,
      city: r.city || null,
      source: (r.source as any) || 'Other',
      owner_id: user.id
    }))
    const { data: ins, error } = await supabase
      .from('leads')
      .upsert(payload, { onConflict: 'primary_phone_norm', ignoreDuplicates: true })
      .select('id')
    if (error) throw error
    inserted += (ins?.length || 0)
  }
  const duplicates = data.length - inserted
  return { inserted, duplicates }
}

export const createLead = async (input: {
  full_name?: string
  primary_phone: string
  alt_phone?: string
  email?: string
  city?: string
  address?: string
  pincode?: string
  source?: 'Facebook'|'Instagram'|'Website'|'WalkIn'|'Referral'|'Other'
  product_interest?: string
  tags?: string[]
  notes?: string
  consent?: boolean
}) => {
  const schema = z.object({
    full_name: z.string().optional(),
    primary_phone: z.string().min(5),
    alt_phone: z.string().optional(),
    email: z.string().email().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    pincode: z.string().optional(),
    source: z.enum(['Facebook','Instagram','Website','WalkIn','Referral','Other']).optional(),
    product_interest: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    consent: z.boolean().optional()
  })
  const data = schema.parse(input)
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  limit(user.id)

  // derive team from profile
  const { data: profile } = await supabase.from('profiles').select('team_id').eq('id', user.id).single()

  const payload: any = {
    ...data,
    source: data.source || 'Other',
    owner_id: user.id,
    team_id: profile?.team_id || null
  }

  const { error } = await supabase.from('leads').insert(payload)
  if (error) {
    if (error.message.includes('duplicate')) throw new Error('A lead with this phone already exists.')
    throw error
  }
  return { ok: true }
}

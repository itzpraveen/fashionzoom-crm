"use server"
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TemplateSchema = z.object({
  // Accept friendly case but normalize to DB enum (uppercase)
  channel: z.enum(['WhatsApp','SMS','Email','WHATSAPP','EMAIL']).transform((c) => (c.toUpperCase() as 'WHATSAPP'|'SMS'|'EMAIL')),
  name: z.string().min(2),
  body: z.string().min(2)
})

async function requireManagerOrAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (me?.role ?? 'TELECALLER') as string
  if (role !== 'MANAGER' && role !== 'ADMIN') throw new Error('Forbidden')
  return supabase
}

export async function createTemplate(formData: FormData) {
  const supabase = await requireManagerOrAdmin()
  const data = TemplateSchema.parse({
    channel: String(formData.get('channel') || 'WHATSAPP') as any,
    name: String(formData.get('name') || ''),
    body: String(formData.get('body') || '')
  })
  const { error } = await supabase.from('templates').insert(data)
  if (error) throw error
  revalidatePath('/settings/templates')
}

export async function deleteTemplate(formData: FormData) {
  const supabase = await requireManagerOrAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/settings/templates')
}

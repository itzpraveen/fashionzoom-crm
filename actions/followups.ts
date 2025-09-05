"use server"
import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeFollowup(formData: FormData) {
  const id = String(formData.get('id') || '')
  if (!id) return
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('followups')
    .update({ status: 'DONE', completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/followups')
}

export async function skipFollowup(formData: FormData) {
  const id = String(formData.get('id') || '')
  const reason = String(formData.get('reason') || '')
  if (!id) return
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('followups')
    .update({ status: 'SKIPPED', remark: reason || null, completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/followups')
}


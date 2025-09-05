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

export async function completeOverdueFollowups() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const now = new Date().toISOString()

  // Fetch pending overdue follow-ups for this user
  const { data, error } = await supabase
    .from('followups')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'PENDING')
    .lt('due_at', now)
    .limit(1000)
  if (error) throw error

  const ids = (data || []).map((r: any) => r.id)
  if (ids.length === 0) return

  const { error: updErr } = await supabase
    .from('followups')
    .update({ status: 'DONE', completed_at: new Date().toISOString() })
    .in('id', ids)
  if (updErr) throw updErr

  revalidatePath('/dashboard/queue')
  revalidatePath('/followups')
  return
}

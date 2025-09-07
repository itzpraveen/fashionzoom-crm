"use server"
import { createDemoSupabase } from '@/lib/supabase/demo'
import { createClient } from '@supabase/supabase-js'

function getPublicClient() {
  if (process.env.NEXT_PUBLIC_DEMO === '1') return createDemoSupabase()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ) as any
}

// Simple server helpers (no unstable_cache) to avoid recursion/stack-depth issues
export async function listEvents() {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function listProgramsByEvent(eventId: string) {
  if (!eventId) return [] as any[]
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

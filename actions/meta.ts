"use server"
import { unstable_cache, revalidateTag } from 'next/cache'
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

// Cached, non-user-specific metadata. Safe to share across users.
export const listEvents = unstable_cache(async () => {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}, ['meta:events'], { revalidate: 300, tags: ['events'] })

export const listProgramsByEvent = (eventId: string) => unstable_cache(async () => {
  if (!eventId) return [] as any[]
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}, ["meta:programs", eventId], { revalidate: 300, tags: ['programs', `programs:${eventId}`] })()

// Helpers to invalidate when events/programs change (called by mutations)
export async function invalidateEventsCache() {
  revalidateTag('events')
}
export async function invalidateProgramsCache(eventId?: string) {
  revalidateTag('programs')
  if (eventId) revalidateTag(`programs:${eventId}`)
}

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Cleaner initial URL for first-time visitors
    redirect('/login')
  }
  // If user exists, send them to a sensible home
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')
  // Default landing after login
  redirect('/dashboard')
}
export const dynamic = 'force-dynamic'

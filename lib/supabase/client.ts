import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createDemoSupabase } from '@/lib/supabase/demo'

export function createBrowserClient() {
  if (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_DEMO === '1')) {
    return createDemoSupabase()
  }
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createDemoSupabase } from './demo'

export function createServerSupabase() {
  if (process.env.NEXT_PUBLIC_DEMO === '1') {
    return createDemoSupabase()
  }
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // In RSC render phase, Next.js disallows cookie mutations.
            // Ignore here; cookies will be set in /auth/callback or server actions.
          }
        },
        remove(name: string, options: CookieOptions) {
          // expire cookie immediately to ensure removal across browsers
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch {
            // See note above about RSC render restrictions.
          }
        },
      }
    }
  )
}

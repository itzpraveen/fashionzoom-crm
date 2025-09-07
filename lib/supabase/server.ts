import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'
import { createDemoSupabase } from './demo'

// Read-only client for Server Components/pages: never mutates cookies.
// Prevents accidental sign-outs when Supabase SDK attempts to rotate/clear cookies
// during a render (which can be disallowed in RSC and lead to cookie loss).
export function createServerSupabase() {
  // Ensure this helper is never invoked inside a cached scope
  noStore()
  if (process.env.NEXT_PUBLIC_DEMO === '1') return createDemoSupabase()
  const cookieStore = cookies()
  return createServerSupabaseFromCookies(cookieStore)
}

// Variant that avoids calling cookies() internally; pass the store from caller
// so dynamic access happens outside any cached function
export function createServerSupabaseFromCookies(cookieStore: ReturnType<typeof cookies>) {
  if (process.env.NEXT_PUBLIC_DEMO === '1') return createDemoSupabase()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        // No-op in RSC to avoid clearing/rotating cookies unexpectedly
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      }
    }
  ) as any
}

// Variant that takes a snapshot of cookie values so no dynamic API
// is referenced inside the returned client lifecycle.
export function createServerSupabaseFromCookieValues(cookieValues: Record<string, string | undefined>) {
  if (process.env.NEXT_PUBLIC_DEMO === '1') return createDemoSupabase()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieValues[name] },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      }
    }
  ) as any
}

// Mutable client for Route Handlers and Server Actions that legitimately
// need to set/clear auth cookies (e.g., /auth/callback, /logout).
export function createMutableServerSupabase() {
  noStore()
  if (process.env.NEXT_PUBLIC_DEMO === '1') return createDemoSupabase()
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options, maxAge: 0 }) },
      }
    }
  )
}

"use client"
import React from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export type AuthUser = { id: string; email?: string | null } | null
export type Profile = { id: string; role?: string | null; team_id?: string | null; full_name?: string | null; updated_at?: string | null } | null

type UserState = {
  user: AuthUser
  profile: Profile
  loading: boolean
  refresh: () => Promise<void>
}

const Ctx = React.createContext<UserState | undefined>(undefined)

export function useUser() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useUser must be used within <UserProvider>')
  return ctx
}

type Stored = { user: AuthUser; profile: Profile; ts: number }

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser>(null)
  const [profile, setProfile] = React.useState<Profile>(null)
  const [loading, setLoading] = React.useState(true)

  const hydrateFromStorage = () => {
    try {
      const raw = localStorage.getItem('fzcrm-auth-status')
      if (!raw) return false
      const parsed = JSON.parse(raw) as Stored
      // accept up to 10s old
      if (Date.now() - parsed.ts > 10000) return false
      setUser(parsed.user)
      setProfile(parsed.profile)
      return true
    } catch { return false }
  }

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth-status', { credentials: 'same-origin' })
      const json = await res.json()
      const nextUser: AuthUser = json?.user || null
      const nextProfile: Profile = json?.profile || null
      setUser(nextUser)
      setProfile(nextProfile)
      try { localStorage.setItem('fzcrm-auth-status', JSON.stringify({ user: nextUser, profile: nextProfile, ts: Date.now() })) } catch {}
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const used = hydrateFromStorage()
    if (!used) refresh()
    else setLoading(false)
  }, [refresh])

  // Subscribe to Supabase auth events for instant updates
  React.useEffect(() => {
    const supabase = createBrowserClient()
    let mounted = true
    // Seed from current user quickly (no network)
    supabase.auth.getUser().then((res: any) => {
      if (!mounted) return
      const current = res?.data?.user ? { id: res.data.user.id, email: res.data.user.email } : null
      // If storage hydration missed or differs, refresh profile
      if ((current?.id || null) !== (user?.id || null)) {
        setUser(current)
        // Profile likely changed with user — fetch fresh
        refresh()
      }
    }).catch(() => {})

    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, session: any) => {
      if (!mounted) return
      const next = session?.user ? { id: session.user.id, email: session.user.email } : null
      setUser(next)
      if (next) {
        // Signed in or token refreshed — refetch profile
        refresh()
      } else {
        // Signed out — clear profile and storage
        setProfile(null)
        try { localStorage.removeItem('fzcrm-auth-status') } catch {}
      }
    })
    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [refresh])

  const value = React.useMemo<UserState>(() => ({ user, profile, loading, refresh }), [user, profile, loading, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

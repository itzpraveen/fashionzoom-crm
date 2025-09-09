"use client"
import React from 'react'

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

  const value = React.useMemo<UserState>(() => ({ user, profile, loading, refresh }), [user, profile, loading, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}


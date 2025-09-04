"use client"
import { useEffect, useState, useTransition } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { bootstrapProfile } from '@/actions/auth'

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const params = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'TELECALLER'|'MANAGER'|'ADMIN'>('TELECALLER')
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // show A2HS prompt hint after login
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})
  }, [])

  useEffect(() => {
    // If profile already exists, skip onboarding
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
      if (profile) {
        const redirect = params.get('redirect') || '/dashboard'
        router.replace(redirect)
      }
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Be resilient to being opened directly with code or with an error hash
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('error')) {
      setAuthError(hash.get('error_description') || 'Invalid or expired link. Please request a new magic link.')
    }
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {
        setAuthError('Could not complete sign-in. Please request a new magic link.')
      })
    }
  }, [supabase])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      await bootstrapProfile({ full_name: fullName, role })
      setDone(true)
      const redirect = params.get('redirect') || '/dashboard'
      router.replace(redirect)
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
      <p className="text-sm text-muted mb-4">Complete your profile to continue.</p>
      {authError && (
        <div className="mb-3 text-sm text-danger">{authError} <button className="underline" onClick={()=>router.replace('/login')}>Go to login</button></div>
      )}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Full name</label>
          <input className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={role} onChange={(e)=>setRole(e.target.value as any)}>
            <option value="TELECALLER">Telecaller</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button disabled={pending} className="touch-target rounded bg-primary text-white font-medium px-4 py-2">{pending ? 'Saving...' : 'Continue'}</button>
        {done && <p className="text-success text-sm">Saved. Go to Leads.</p>}
      </form>
    </div>
  )
}

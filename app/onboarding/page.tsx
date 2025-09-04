"use client"
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'TELECALLER'|'MANAGER'|'ADMIN'>('TELECALLER')
  const [teamName, setTeamName] = useState('')
  const [done, setDone] = useState(false)

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
      if (profile) router.replace('/dashboard')
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // ensure team exists or create
    let teamId: string | null = null
    if (teamName) {
      const { data: team } = await supabase.from('teams').insert({ name: teamName }).select('*').single()
      teamId = team?.id ?? null
    }
    await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, role, team_id: teamId })
    setDone(true)
    router.replace('/dashboard')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
      <p className="text-sm text-muted mb-4">Complete your profile to continue.</p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Full name</label>
          <input className="w-full rounded bg-white/5 border border-white/10 px-3 py-2" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select className="w-full rounded bg-white/5 border border-white/10 px-3 py-2" value={role} onChange={(e)=>setRole(e.target.value as any)}>
            <option value="TELECALLER">Telecaller</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Team name (optional)</label>
          <input className="w-full rounded bg-white/5 border border-white/10 px-3 py-2" value={teamName} onChange={(e)=>setTeamName(e.target.value)} />
        </div>
        <button className="touch-target rounded bg-primary text-black font-medium px-4 py-2">Continue</button>
        {done && <p className="text-success text-sm">Saved. Go to Leads.</p>}
      </form>
    </div>
  )
}

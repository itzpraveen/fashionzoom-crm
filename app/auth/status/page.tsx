import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AuthStatusPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieList = cookies().getAll()
  const { data: profile } = user ? await supabase.from('profiles').select('id, role, team_id, full_name, updated_at').eq('id', user.id).maybeSingle() : { data: null }
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Auth Status (Server)</h1>
      <div className="text-sm"><b>User:</b> {user ? `${user.email} (${user.id})` : 'null'}</div>
      <div className="text-sm"><b>Role:</b> {(profile as any)?.role || '—'}</div>
      <div className="text-sm"><b>Cookies:</b> {cookieList.map(c=>c.name).join(', ')}</div>
      <pre className="text-xs whitespace-pre-wrap bg-black/10 rounded p-2 border border-white/10">{JSON.stringify({ user: user ? { id: user.id, email: user.email } : null, profile, cookies: cookieList.map(c=>({ name: c.name, preview: (c.value||'').slice(0,10), len: (c.value||'').length })) }, null, 2)}</pre>
    </div>
  )
}


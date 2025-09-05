import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RulesPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: rules } = await supabase.from('assignment_rules').select('*').order('created_at', { ascending: false })
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Assignment Rules</h1>
      <div className="space-y-2">
        {rules?.map((r: any) => (
          <div key={r.id} className="border border-white/10 rounded p-3 text-sm">
            <div className="font-medium">{r.name}</div>
            <div className="text-muted">{r.strategy} • {r.is_active? 'Active':'Inactive'}</div>
          </div>
        ))}
        {!rules?.length && <p className="text-sm text-muted">No rules yet.</p>}
      </div>
    </div>
  )
}

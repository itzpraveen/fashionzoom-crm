import { DashboardTiles } from '@/components/DashboardTiles'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardOverviewPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Compute counts
  const now = new Date().toISOString()
  const { count: overdueCount } = await supabase.from('followups').select('*',{ count:'exact', head:true }).lt('due_at', now).eq('status','PENDING')
  const today = new Date(); today.setHours(0,0,0,0)
  const { data: recentLeads } = await supabase.from('leads').select('id, full_name, city, source, created_at, primary_phone, status, score, next_follow_up_at, last_activity_at').gte('created_at', today.toISOString()).order('created_at',{ ascending:false }).limit(5)
  const { data: overdue } = await supabase.from('followups').select('id, due_at, priority, remark, leads(full_name)').lt('due_at', now).eq('status','PENDING').order('due_at',{ ascending:true }).limit(5)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Overview</h1>
      <DashboardTiles />
      <section className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">Overdue follow-ups <span className="text-xs rounded-full px-2 py-0.5 border border-danger/30 bg-danger/10 text-danger">{overdueCount || 0}</span></h2>
        <div className="space-y-2">
          {(overdue||[]).map((f:any)=> (
            <div key={f.id} className="card p-2 text-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">{new Date(f.due_at).toLocaleString()} • {f.priority}</div>
                <div>{(f as any).leads?.full_name || '—'}</div>
                {f.remark && <div className="text-xs mt-0.5">{f.remark}</div>}
              </div>
              <a href="/followups" className="px-2 py-1 rounded bg-primary text-white text-xs">Open</a>
            </div>
          ))}
          {(!overdue || overdue.length===0) && <p className="text-sm text-muted">Nothing overdue — nice work.</p>}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">Today’s leads <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{recentLeads?.length || 0}</span></h2>
        <div className="space-y-2">
          {(recentLeads||[]).map((l:any)=> (
            <div key={l.id} className="card p-2 text-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">{new Date(l.created_at).toLocaleString()} • {l.source}</div>
                <div>{l.full_name || '—'} {l.city ? <span className="text-xs text-muted">• {l.city}</span> : null}</div>
              </div>
              <a href={`/leads/${l.id}`} className="px-2 py-1 rounded bg-white/10 text-xs">Open</a>
            </div>
          ))}
          {(!recentLeads || recentLeads.length===0) && <p className="text-sm text-muted">No leads created yet today.</p>}
        </div>
      </section>
    </div>
  )
}
export const dynamic = 'force-dynamic'

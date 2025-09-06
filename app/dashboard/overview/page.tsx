import { DashboardTiles } from '@/components/DashboardTiles'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardOverviewPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const now = new Date().toISOString()
  const { count: overdueCount } = await supabase
    .from('followups')
    .select('*',{ count:'exact', head:true })
    .lt('due_at', now)
    .eq('status','PENDING')
  const today = new Date(); today.setHours(0,0,0,0)
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, full_name, city, source, created_at, primary_phone, status, score, next_follow_up_at, last_activity_at')
    .gte('created_at', today.toISOString())
    .order('created_at',{ ascending:false })
    .limit(5)
  const { data: overdue } = await supabase
    .from('followups')
    .select('id, due_at, priority, remark, leads(full_name)')
    .lt('due_at', now)
    .eq('status','PENDING')
    .order('due_at',{ ascending:true })
    .limit(5)

  return (
    <div className="space-y-4">
      <DashboardTiles />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card p-3 md:p-4 space-y-3" aria-labelledby="overdue-heading">
          <div className="flex items-center justify-between">
            <h2 id="overdue-heading" className="font-semibold flex items-center gap-2">
              Overdue follow-ups
              <span className="text-xs rounded-full px-2 py-0.5 border border-danger/30 bg-danger/10 text-danger">{overdueCount || 0}</span>
            </h2>
            <Link href="/dashboard/queue?due=today" className="text-xs text-muted hover:text-fg">View all</Link>
          </div>
          <div className="space-y-2">
            {(overdue||[]).map((f:any)=> (
              <div key={f.id} className="p-3 text-sm flex items-center justify-between rounded border border-line">
                <div className="min-w-0">
                  <div className="text-xs text-muted truncate">{new Date(f.due_at).toLocaleString()} • {f.priority}</div>
                  <div className="truncate">{(f as any).leads?.full_name || '—'}</div>
                  {f.remark && <div className="text-xs mt-0.5 truncate">{f.remark}</div>}
                </div>
                <Link href="/followups" className="px-2 py-1 rounded bg-primary text-white text-xs">Open</Link>
              </div>
            ))}
            {(!overdue || overdue.length===0) && <p className="text-sm text-muted">Nothing overdue — nice work.</p>}
          </div>
        </section>

        <section className="card p-3 md:p-4 space-y-3" aria-labelledby="todays-leads-heading">
          <div className="flex items-center justify-between">
            <h2 id="todays-leads-heading" className="font-semibold flex items-center gap-2">
              Today’s leads
              <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{recentLeads?.length || 0}</span>
            </h2>
            <Link href="/leads" className="text-xs text-muted hover:text-fg">View all</Link>
          </div>
          <div className="space-y-2">
            {(recentLeads||[]).map((l:any)=> (
              <div key={l.id} className="p-3 text-sm flex items-center justify-between rounded border border-line">
                <div className="min-w-0">
                  <div className="text-xs text-muted truncate">{new Date(l.created_at).toLocaleString()} • {l.source}</div>
                  <div className="truncate">{l.full_name || '—'} {l.city ? <span className="text-xs text-muted">• {l.city}</span> : null}</div>
                </div>
                <Link href={`/leads/${l.id}`} className="px-2 py-1 rounded bg-white/10 text-xs">Open</Link>
              </div>
            ))}
            {(!recentLeads || recentLeads.length===0) && <p className="text-sm text-muted">No leads created yet today.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'

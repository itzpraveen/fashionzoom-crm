import { DashboardTiles } from '@/components/DashboardTiles'
import { createServerSupabase } from '@/lib/supabase/server'
import { cachedQuery } from '@/lib/cache/query-cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardMetrics } from '@/lib/services/dashboard.service'

export default async function DashboardOverviewPage({ searchParams }: { searchParams?: { scope?: 'me'|'all' } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const today = new Date(); today.setHours(0,0,0,0)
  const now = new Date().toISOString()
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (me?.role || 'TELECALLER').toString().toUpperCase()
  const elevated = role === 'MANAGER' || role === 'ADMIN' || role === 'OWNER' || role === 'SUPERADMIN' || role === 'SUPER_ADMIN'
  const scope = elevated ? (searchParams?.scope === 'me' ? 'me' : 'all') : 'me'

  // Cache the dashboard overview payload briefly to avoid repeated work on quick navigations
  const data = await cachedQuery(
    `dash:overview:${user.id}:${scope}`,
    async () => {
      // Scope filters
      const overdueCountQ = supabase
        .from('followups')
        .select('*', { count: 'exact', head: true })
        .lt('due_at', now)
        .eq('status', 'PENDING')
      const recentLeadsQ = supabase
        .from('leads')
        .select('id, full_name, city, source, created_at, primary_phone, status, score, next_follow_up_at, last_activity_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)
      const overdueQ = supabase
        .from('followups')
        .select('id, due_at, priority, remark, leads(full_name), user_id')
        .lt('due_at', now)
        .eq('status', 'PENDING')
        .order('due_at', { ascending: true })
        .limit(5)

      if (scope === 'me') {
        overdueCountQ.eq('user_id', user.id)
        overdueQ.eq('user_id', user.id)
        recentLeadsQ.eq('owner_id', user.id)
      }

      const [overdueCountRes, recentLeadsRes, overdueRes] = await Promise.all([overdueCountQ, recentLeadsQ, overdueQ])
      return {
        overdueCount: overdueCountRes.count || 0,
        recentLeads: recentLeadsRes.data || [],
        overdue: overdueRes.data || []
      }
    },
    10000
  )

  // Server-render the top tiles to avoid client waterfalls; update live on client
  const metrics = await cachedQuery(
    'dash:metrics',
    () => getDashboardMetrics(),
    10000
  )

  return (
    <div className="space-y-4">
      <DashboardTiles initial={metrics} />

      <div className="flex items-center justify-end">
        {elevated && (
          <nav className="inline-flex items-center gap-1 text-xs rounded-lg bg-white/5 ring-1 ring-inset ring-white/10 p-0.5" aria-label="Scope">
            <Link href={{ pathname: '/dashboard/overview', query: { scope: 'me' } }} className={`px-2.5 py-1.5 rounded-md transition-colors ${scope==='me' ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-white/10 hover:text-fg'}`}>My</Link>
            <Link href={{ pathname: '/dashboard/overview', query: { scope: 'all' } }} className={`px-2.5 py-1.5 rounded-md transition-colors ${scope!=='me' ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-white/10 hover:text-fg'}`}>All</Link>
          </nav>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card p-3 md:p-4 space-y-3" aria-labelledby="overdue-heading">
          <div className="flex items-center justify-between">
            <h2 id="overdue-heading" className="font-semibold flex items-center gap-2">
              Overdue follow-ups
              <span className="text-xs rounded-full px-2 py-0.5 border border-danger/30 bg-danger/10 text-danger">{data.overdueCount}</span>
            </h2>
            <Link href="/dashboard/queue?due=today" className="text-xs text-muted hover:text-fg">View all</Link>
          </div>
          <div className="space-y-2">
            {(data.overdue||[]).map((f:any)=> (
              <div key={f.id} className="p-3 text-sm flex items-center justify-between rounded border border-line">
                <div className="min-w-0">
                  <div className="text-xs text-muted truncate">{new Date(f.due_at).toLocaleString()} • {f.priority}</div>
                  <div className="truncate">{(f as any).leads?.full_name || '—'}</div>
                  {f.remark && <div className="text-xs mt-0.5 truncate">{f.remark}</div>}
                </div>
                <Link href="/followups" className="px-2 py-1 rounded bg-primary text-white text-xs">Open</Link>
              </div>
            ))}
            {(!data.overdue || data.overdue.length===0) && <p className="text-sm text-muted">Nothing overdue — nice work.</p>}
          </div>
        </section>

        <section className="card p-3 md:p-4 space-y-3" aria-labelledby="todays-leads-heading">
          <div className="flex items-center justify-between">
            <h2 id="todays-leads-heading" className="font-semibold flex items-center gap-2">
              Today’s leads
              <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{data.recentLeads?.length || 0}</span>
            </h2>
            <Link href="/leads" className="text-xs text-muted hover:text-fg">View all</Link>
          </div>
          <div className="space-y-2">
            {(data.recentLeads||[]).map((l:any)=> (
              <div key={l.id} className="p-3 text-sm flex items-center justify-between rounded border border-line">
                <div className="min-w-0">
                  <div className="text-xs text-muted truncate">{new Date(l.created_at).toLocaleString()} • {l.source}</div>
                  <div className="truncate">{l.full_name || '—'} {l.city ? <span className="text-xs text-muted">• {l.city}</span> : null}</div>
                </div>
                <Link href={`/leads/${l.id}`} className="px-2 py-1 rounded bg-white/10 text-xs">Open</Link>
              </div>
            ))}
            {(!data.recentLeads || data.recentLeads.length===0) && <p className="text-sm text-muted">No leads created yet today.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'

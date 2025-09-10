import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { EmptyState } from '@/components/EmptyState'
import { completeOverdueFollowups } from '@/actions/followups'

export const dynamic = 'force-dynamic'

export default async function MyQueuePage({ searchParams }: { searchParams?: { due?: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch top 20 leads for me, overdue first then due soon then new
  const now = new Date().toISOString()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, full_name, city, source, next_follow_up_at, last_activity_at, primary_phone, status')
    .eq('owner_id', user.id)
    .eq('is_deleted', false)
    .order('next_follow_up_at', { ascending: true, nullsFirst: false })
    .limit(50)

  if (error) {
    console.error('Error fetching my queue:', error)
  }

  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0)
  const endOfDay = new Date(); endOfDay.setHours(23,59,59,999)
  const filterToday = searchParams?.due === 'today'

  const overdue = (leads || []).filter((l: any) => l.next_follow_up_at && l.next_follow_up_at < now)
  const due = (leads || []).filter((l: any) => l.next_follow_up_at && l.next_follow_up_at >= now)
  const fresh = (leads || []).filter((l: any) => !l.next_follow_up_at)

  const inTodayRange = (iso?: string | null) => {
    if (!iso) return false
    const t = new Date(iso).getTime()
    return t >= startOfDay.getTime() && t <= endOfDay.getTime()
  }
  const overdueShown = filterToday ? overdue.filter((l:any)=>inTodayRange(l.next_follow_up_at)) : overdue
  const dueShown = filterToday ? due.filter((l:any)=>inTodayRange(l.next_follow_up_at)) : due
  const freshShown = filterToday ? fresh : fresh

  if (!leads?.length) {
    return <EmptyState title="No leads in your queue" hint="Import or add leads to get started" actionHref="/import" actionLabel="Import leads" />
  }

  // Role is not required here for masking; default to TELECALLER
  return (
    <div className="space-y-3">
      {/* Bulk actions */}
      {overdue.length > 0 && (
        <form action={completeOverdueFollowups} className="flex items-center justify-between border border-danger/30 bg-danger/10 rounded p-2">
          <div className="text-sm">Overdue follow-ups: <span className="font-medium">{overdue.length}</span></div>
          <button className="rounded bg-success text-black px-3 py-1.5 text-xs">Complete all overdue</button>
        </form>
      )}

      {overdue.length > 0 && (
        <section aria-label="Overdue" className="space-y-2">
          <h2 className="font-semibold text-danger">Overdue ({overdueShown.length})</h2>
          {overdueShown.map((l: any) => <LeadCard key={l.id} lead={l as any} role={'TELECALLER'} />)}
        </section>
      )}
      {due.length > 0 && (
        <section aria-label="Due soon" className="space-y-2">
          <h2 className="font-semibold">Due soon ({dueShown.length})</h2>
          {dueShown.map((l: any) => <LeadCard key={l.id} lead={l as any} role={'TELECALLER'} />)}
        </section>
      )}
      {fresh.length > 0 && (
        <section aria-label="New" className="space-y-2">
          <h2 className="font-semibold">New ({freshShown.length})</h2>
          {freshShown.map((l: any) => <LeadCard key={l.id} lead={l as any} role={'TELECALLER'} />)}
        </section>
      )}
    </div>
  )
}

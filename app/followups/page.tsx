import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/EmptyState'
import { completeFollowup, skipFollowup } from '@/actions/followups'

export default async function FollowupsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('followups').select('*, leads(full_name)').order('due_at', { ascending: true }).limit(200)

  const now = new Date()
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
  const overdue = (data||[]).filter((f: any) => f.status === 'PENDING' && new Date(f.due_at) < now)
  const today = (data||[]).filter((f: any) => f.status === 'PENDING' && new Date(f.due_at) >= todayStart && new Date(f.due_at) <= todayEnd)
  const upcoming = (data||[]).filter((f: any) => f.status === 'PENDING' && new Date(f.due_at) > todayEnd)

  const Card = ({ f }: { f: any }) => (
    <div className="card p-2 text-sm flex items-center justify-between gap-2">
      <div>
        <div className="text-muted text-xs">{new Date(f.due_at).toLocaleString()} • {f.priority} • {f.status}</div>
        <div>{(f as any).leads?.full_name || '—'}</div>
        {f.remark && <div className="text-xs mt-0.5">{f.remark}</div>}
      </div>
      <div className="flex items-center gap-2">
        <form action={completeFollowup}>
          <input type="hidden" name="id" value={f.id} />
          <button className="rounded bg-success text-black px-2 py-1 text-xs">Complete</button>
        </form>
        <form action={skipFollowup} className="hidden sm:flex items-center gap-1">
          <input type="hidden" name="id" value={f.id} />
          <input name="reason" placeholder="reason" className="form-input w-32 text-xs" />
          <button className="rounded bg-white/10 px-2 py-1 text-xs">Skip</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold">Follow-ups</h1>
      </div>
      {(overdue.length + today.length + upcoming.length) === 0 ? (
        <EmptyState title="No follow-ups due." hint="Import leads or create a reminder." actionHref="/import" actionLabel="Import leads" />
      ) : (
        <>
          {overdue.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold text-danger flex items-center gap-2">Overdue <span className="text-xs rounded-full px-2 py-0.5 border border-danger/30 bg-danger/10 text-danger">{overdue.length}</span></h2>
              {overdue.map((f:any) => <Card key={f.id} f={f} />)}
            </section>
          )}
          {today.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold flex items-center gap-2">Today <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{today.length}</span></h2>
              {today.map((f:any) => <Card key={f.id} f={f} />)}
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold flex items-center gap-2">Upcoming <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{upcoming.length}</span></h2>
              {upcoming.map((f:any) => <Card key={f.id} f={f} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
export const dynamic = 'force-dynamic'

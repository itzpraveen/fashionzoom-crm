import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/EmptyState'
import { completeFollowup, skipFollowup } from '@/actions/followups'

export default async function FollowupsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('followups').select('*, leads(full_name)').order('due_at', { ascending: true }).limit(100)
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Follow-ups</h1>
      <div className="space-y-2">
        {data?.map((f: any) => (
          <div key={f.id} className="border border-white/10 rounded p-2 text-sm flex items-center justify-between gap-2">
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
                <input name="reason" placeholder="reason" className="rounded bg-white/5 border border-white/10 px-2 py-1 text-xs" />
                <button className="rounded bg-white/10 px-2 py-1 text-xs">Skip</button>
              </form>
            </div>
          </div>
        ))}
        {!data?.length && <EmptyState title="No follow-ups due." hint="Import leads or create a reminder." actionHref="/import" actionLabel="Import leads" />}
      </div>
    </div>
  )
}

import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/EmptyState'

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
          <div key={f.id} className="border border-white/10 rounded p-2 text-sm flex items-center justify-between">
            <div>
              <div className="text-muted text-xs">{new Date(f.due_at).toLocaleString()} • {f.priority} • {f.status}</div>
              <div>{(f as any).leads?.full_name || '—'}</div>
            </div>
            <button className="rounded bg-success text-black px-2 py-1 text-xs">Complete</button>
          </div>
        ))}
        {!data?.length && <EmptyState title="No follow-ups due." hint="Import leads or create a reminder." actionHref="/import" actionLabel="Import leads" />}
      </div>
    </div>
  )
}

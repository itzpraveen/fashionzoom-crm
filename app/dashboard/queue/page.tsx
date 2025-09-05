import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { EmptyState } from '@/components/EmptyState'

export const dynamic = 'force-dynamic'

export default async function MyQueuePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch top 20 leads for me, overdue first then due soon then new
  const now = new Date().toISOString()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_deleted', false)
    .order('next_follow_up_at', { ascending: true, nullsFirst: false })
    .limit(50)

  if (error) {
    console.error('Error fetching my queue:', error)
  }

  const overdue = (leads || []).filter((l: any) => l.next_follow_up_at && l.next_follow_up_at < now)
  const due = (leads || []).filter((l: any) => l.next_follow_up_at && l.next_follow_up_at >= now)
  const fresh = (leads || []).filter((l: any) => !l.next_follow_up_at)

  if (!leads?.length) {
    return <EmptyState title="No leads in your queue" hint="Import or add leads to get started" actionHref="/import" actionLabel="Import leads" />
  }

  // Role is not required here for masking; default to TELECALLER
  return (
    <div className="space-y-3">
      {overdue.length > 0 && (
        <section aria-label="Overdue" className="space-y-2">
          <h2 className="font-semibold text-danger">Overdue ({overdue.length})</h2>
          {overdue.map((l: any) => <LeadCard key={l.id} lead={l as any} role={'TELECALLER'} />)}
        </section>
      )}
      {due.length > 0 && (
        <section aria-label="Due soon" className="space-y-2">
          <h2 className="font-semibold">Due soon ({due.length})</h2>
          {due.map((l: any) => <LeadCard key={l.id} lead={l as any} role={'TELECALLER'} />)}
        </section>
      )}
      {fresh.length > 0 && (
        <section aria-label="New" className="space-y-2">
          <h2 className="font-semibold">New ({fresh.length})</h2>
          {fresh.map((l: any) => <LeadCard key={l.id} lead={l as any} role={'TELECALLER'} />)}
        </section>
      )}
    </div>
  )
}


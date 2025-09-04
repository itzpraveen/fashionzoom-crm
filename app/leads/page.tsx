import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/EmptyState'
import { LeadCard } from '@/components/LeadCard'
import { Skeleton } from '@/components/Skeleton'
import { AddLeadButton } from '@/components/AddLeadButton'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <EmptyState title="You are not signed in" hint="Login to view your queue." actionHref="/login" actionLabel="Login" />
  }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const now = new Date().toISOString()
  const { data: overdue } = await supabase.from('leads').select('*').eq('owner_id', user.id).lt('next_follow_up_at', now).order('next_follow_up_at', { ascending: true }).limit(10)
  const { data: due } = await supabase.from('leads').select('*').eq('owner_id', user.id).gte('next_follow_up_at', now).order('next_follow_up_at', { ascending: true }).limit(10)
  const { data: fresh } = await supabase.from('leads').select('*').eq('owner_id', user.id).is('next_follow_up_at', null).order('created_at', { ascending: true }).limit(10)

  const role = (profile?.role ?? 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'

  return (
    <div className="space-y-4">
      {/* Add Lead CTA (client-side modal trigger via hash) */}
      <div className="flex items-center"><AddLeadButton /></div>
      <section aria-label="Overdue" className="space-y-2">
        <h2 className="font-semibold">Overdue</h2>
        {overdue?.length ? overdue.map(l => <LeadCard key={l.id} lead={l as any} role={role} />) : <p className="text-sm text-muted">No overdue. Great job!</p>}
      </section>
      <section aria-label="Due soon" className="space-y-2">
        <h2 className="font-semibold">Due soon</h2>
        {due?.length ? due.map(l => <LeadCard key={l.id} lead={l as any} role={role} />) : <p className="text-sm text-muted">No follow-ups due soon.</p>}
      </section>
      <section aria-label="New" className="space-y-2">
        <h2 className="font-semibold">New</h2>
        {fresh?.length ? fresh.map(l => <LeadCard key={l.id} lead={l as any} role={role} />) : <Skeleton className="h-16" />}
      </section>
      {/* Modal is managed in client via AddLeadButton */}
    </div>
  )
}

import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DispositionSheet } from '@/components/DispositionSheet'
import { FollowUpForm } from '@/components/FollowUpForm'
import { BadgeScore } from '@/components/BadgeScore'
import { normalizePhone, waLink } from '@/lib/phone'
import ComposeModal from '@/components/ComposeModal'
import { LeadEnrollments } from '@/components/LeadEnrollments'

// Ensure per-request SSR with cookies (avoid static pre-render causing auth redirect)
export const dynamic = 'force-dynamic'

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: lead } = await supabase.from('leads').select('*').eq('id', params.id).single()
  const { data: acts } = await supabase.from('activities').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }).limit(50)
  const { data: fls } = await supabase.from('followups').select('*').eq('lead_id', params.id).order('due_at', { ascending: true }).limit(50)

  if (!lead) return <div>Lead not found</div>

  const n = normalizePhone(lead.primary_phone)
  const telHref = n ? `tel:+91${n}` : `tel:${lead.primary_phone}`
  const waHref = waLink(lead.primary_phone)

  return (
    <div className="space-y-4">
      <header className="card p-3 flex items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold truncate">{lead.full_name || '—'} <span className="text-muted text-sm font-normal">{lead.city || ''}</span></h1>
          <div className="text-sm text-muted flex items-center gap-2 mt-0.5"><span className="uppercase tracking-wide text-[11px]">{lead.status}</span> <BadgeScore score={lead.score} /></div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={telHref} className="rounded bg-white/10 px-3 py-2 text-xs sm:text-sm">Call</a>
          <a href={waHref} className="rounded bg-white/10 px-3 py-2 text-xs sm:text-sm">WhatsApp</a>
          <a href={`mailto:${lead.email ?? ''}`} className="rounded bg-white/10 px-3 py-2 text-xs sm:text-sm">Email</a>
          <ComposeModal lead={{ id: lead.id, full_name: lead.full_name, primary_phone: lead.primary_phone, email: lead.email }} />
        </div>
      </header>
      <div className="grid md:grid-cols-2 gap-4">
        <section>
          <h2 className="font-semibold mb-2">Timeline</h2>
          <div className="space-y-2">
            {acts?.map((a: any) => (
              <div key={a.id} className="card p-2 text-sm">
                <div className="text-muted text-xs">{new Date(a.created_at).toLocaleString()} • {a.type} {a.outcome ? `• ${a.outcome}`:''}</div>
                {a.message && <div>{a.message}</div>}
              </div>
            ))}
            {!acts?.length && <div className="text-sm text-muted">No activity yet.</div>}
          </div>
        </section>
        <section>
          <h2 className="font-semibold mb-2">Follow-ups</h2>
          <FollowUpForm leadId={lead.id} />
          <div className="space-y-2 mt-2">
            {fls?.map((f: any) => (
              <div key={f.id} className="card p-2 text-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted">Due {new Date(f.due_at).toLocaleString()} • {f.priority}</div>
                  {f.remark}
                </div>
                <form action="#" method="dialog">
                  <button className="rounded bg-success text-black px-2 py-1 text-xs">Done</button>
                </form>
              </div>
            ))}
            {!fls?.length && <div className="text-sm text-muted">No follow-ups.</div>}
          </div>
        </section>
      </div>
      <LeadEnrollments leadId={lead.id} />
      {/* Offer disposition sheet entry */}
      <DispositionSheet leadId={lead.id} />
    </div>
  )
}

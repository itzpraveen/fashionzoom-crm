import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DispositionSheet } from '@/components/DispositionSheet'
import { FollowUpForm } from '@/components/FollowUpForm'
import { BadgeScore } from '@/components/BadgeScore'

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: lead } = await supabase.from('leads').select('*').eq('id', params.id).single()
  const { data: acts } = await supabase.from('activities').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }).limit(50)
  const { data: fls } = await supabase.from('followups').select('*').eq('lead_id', params.id).order('due_at', { ascending: true }).limit(50)

  if (!lead) return <div>Lead not found</div>

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">{lead.full_name || '—'} <span className="text-muted text-sm">{lead.city || ''}</span></h1>
          <div className="text-sm text-muted">{lead.status} • <BadgeScore score={lead.score} /></div>
        </div>
        <div className="ml-auto flex gap-2">
          <a href={`tel:${lead.primary_phone}`} className="rounded bg-white/10 px-3 py-2 text-sm">Call</a>
          <a href={`https://wa.me/91${lead.primary_phone}`} className="rounded bg-white/10 px-3 py-2 text-sm">WhatsApp</a>
          <a href={`mailto:${lead.email ?? ''}`} className="rounded bg-white/10 px-3 py-2 text-sm">Email</a>
        </div>
      </header>
      <div className="grid md:grid-cols-2 gap-4">
        <section>
          <h2 className="font-semibold mb-2">Timeline</h2>
          <div className="space-y-2">
            {acts?.map((a) => (
              <div key={a.id} className="border border-white/10 rounded p-2 text-sm">
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
            {fls?.map((f) => (
              <div key={f.id} className="border border-white/10 rounded p-2 text-sm flex items-center justify-between">
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
      {/* Offer disposition sheet entry */}
      <DispositionSheet leadId={lead.id} />
    </div>
  )
}

"use client"
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { createBrowserClient } from '@/lib/supabase/client-with-retry'
import { upsertEnrollment } from '@/actions/leads'

type Enrollment = {
  id: string
  event_id: string
  program_id: string | null
  status: 'INTERESTED'|'APPLIED'|'ENROLLED'|'ATTENDED'|'CANCELLED'
  created_at: string
  updated_at: string
  programs?: { name: string } | null
  events?: { name: string, season?: string | null } | null
}

export function LeadEnrollments({ leadId }: { leadId: string }) {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [items, setItems] = useState<Enrollment[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [programId, setProgramId] = useState('')
  const [status, setStatus] = useState<Enrollment['status']>('INTERESTED')
  const [pending, start] = useTransition()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('lead_enrollments')
      .select('*, programs(name), events(name, season)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    setItems((data as any) || [])
  }, [supabase, leadId])

  useEffect(() => { load() }, [load])
  useEffect(() => { supabase.from('events').select('*').order('created_at', { ascending: false }).then(({ data }) => setEvents((data as any) || [])) }, [supabase])
  useEffect(() => {
    if (!eventId) { setPrograms([]); setProgramId(''); return }
    supabase.from('programs').select('*').eq('event_id', eventId).order('created_at', { ascending: true }).then(({ data }) => setPrograms((data as any) || []))
  }, [eventId, supabase])

  return (
    <section className="space-y-2">
      <h2 className="font-semibold mb-2">Shows & Programs</h2>
      <div className="space-y-1">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted">Event</label>
            <select className="form-input" value={eventId} onChange={e=>setEventId(e.target.value)}>
              <option value="">— Select event —</option>
              {events.map((e:any)=>(<option key={e.id} value={e.id}>{e.season ? `${e.name} (${e.season})` : e.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Program</label>
            <select className="form-input" value={programId} onChange={e=>setProgramId(e.target.value)} disabled={!eventId}>
              <option value="">— optional —</option>
              {programs.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Status</label>
            <select className="form-input" value={status} onChange={e=>setStatus(e.target.value as any)}>
              {['INTERESTED','APPLIED','ENROLLED','ATTENDED','CANCELLED'].map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <button
              disabled={!eventId || pending}
              onClick={()=>start(async ()=>{ await upsertEnrollment({ leadId, eventId, programId: programId || undefined, status }); setEventId(''); setProgramId(''); setStatus('INTERESTED'); await load() })}
              className="btn-primary"
            >Add/Update</button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((en) => (
          <div key={en.id} className="border border-white/10 rounded p-2 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{en.events?.name || 'Event'}{en.events?.season ? ` (${en.events.season})` : ''}</div>
              <div className="text-xs text-muted">{en.programs?.name || '—'} • {en.status} • since {new Date(en.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
        {!items.length && <div className="text-sm text-muted">No program history.</div>}
      </div>
    </section>
  )
}

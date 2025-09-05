"use client"
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client-with-retry'

type Event = { id: string; name: string; season?: string | null }
type Program = { id: string; name: string; event_id: string }

export function EventProgramPicker({
  value,
  onChange,
  compact
}: {
  value?: { event_id?: string; program_id?: string }
  onChange: (v: { event_id?: string; program_id?: string }) => void
  compact?: boolean
}) {
  const supabase = createBrowserClient()
  const [events, setEvents] = useState<Event[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [eventId, setEventId] = useState<string | undefined>(value?.event_id)
  const [programId, setProgramId] = useState<string | undefined>(value?.program_id)

  useEffect(() => {
    supabase.from('events').select('*').order('created_at', { ascending: false }).then(({ data }) => setEvents((data as any) || []))
  }, [])

  useEffect(() => {
    if (!eventId) { setPrograms([]); setProgramId(undefined); return }
    supabase.from('programs').select('*').eq('event_id', eventId).order('created_at', { ascending: true }).then(({ data }) => setPrograms((data as any) || []))
  }, [eventId])

  useEffect(() => { onChange({ event_id: eventId, program_id: programId }) }, [eventId, programId])

  const eventLabel = (e: Event) => e.season ? `${e.name} (${e.season})` : e.name

  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-1' : 'grid-cols-1 sm:grid-cols-2 gap-2'}`}>
      <div>
        <label className="block text-xs text-muted">Event / Show</label>
        <select className="form-input w-full" value={eventId || ''} onChange={e=>setEventId(e.target.value || undefined)}>
          <option value="">— Select event —</option>
          {events.map(e => (<option key={e.id} value={e.id}>{eventLabel(e)}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted">Program</label>
        <select className="form-input w-full" value={programId || ''} onChange={e=>setProgramId(e.target.value || undefined)} disabled={!eventId}>
          <option value="">— {eventId ? 'Select program' : 'Choose event first'} —</option>
          {programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
    </div>
  )
}


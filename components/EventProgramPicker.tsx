"use client"
import { useEffect, useState } from 'react'

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
  const [events, setEvents] = useState<Event[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [eventId, setEventId] = useState<string | undefined>(value?.event_id)
  const [programId, setProgramId] = useState<string | undefined>(value?.program_id)

  useEffect(() => {
    fetch('/api/meta/events', { cache: 'no-store' })
      .then(r=>r.json())
      .then((data:any)=> setEvents(Array.isArray(data) ? data : []))
      .catch(()=>{})
  }, [])

  useEffect(() => {
    if (!eventId) { setPrograms([]); setProgramId(undefined); return }
    fetch(`/api/meta/programs?eventId=${encodeURIComponent(eventId)}`, { cache: 'no-store' })
      .then(r=>r.json())
      .then((data:any)=> setPrograms(Array.isArray(data) ? data : []))
      .catch(()=>{})
  }, [eventId])

  useEffect(() => { onChange({ event_id: eventId, program_id: programId }) }, [eventId, programId, onChange])

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

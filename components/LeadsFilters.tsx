"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef } from 'react'

export function LeadsFilters({ status, search, due }: { status?: string; search?: string; due?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // lazy import to avoid SSR issues
  const [events, setEvents] = React.useState<any[]>([])
  const [programs, setPrograms] = React.useState<any[]>([])
  const [eventId, setEventId] = React.useState<string | undefined>(() => params?.get('event_id') || undefined)
  const [programId, setProgramId] = React.useState<string | undefined>(() => params?.get('program_id') || undefined)

  React.useEffect(() => {
    fetch('/api/meta/events')
      .then(r => r.json())
      .then((data:any) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Keep event/program selection in sync with URL params and refresh programs when event changes
  const eventIdParam = params?.get('event_id') || undefined
  const programIdParam = params?.get('program_id') || undefined
  React.useEffect(() => {
    setEventId(eventIdParam)
    setProgramId(programIdParam)
    if (!eventIdParam) {
      setPrograms([])
      return
    }
    fetch(`/api/meta/programs?eventId=${encodeURIComponent(eventIdParam)}`)
      .then(r=>r.json())
      .then((data:any) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [eventIdParam, programIdParam])

  const buildUrl = useCallback((next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params?.toString())
    if (next.status !== undefined) {
      if (next.status) p.set('status', next.status)
      else p.delete('status')
    }
    if (next.search !== undefined) {
      if (next.search) p.set('search', next.search)
      else p.delete('search')
    }
    if (next.due !== undefined) {
      if (next.due) p.set('due', next.due)
      else p.delete('due')
    }
    if (next.event_id !== undefined) {
      if (next.event_id) p.set('event_id', next.event_id)
      else p.delete('event_id')
    }
    if (next.program_id !== undefined) {
      if (next.program_id) p.set('program_id', next.program_id)
      else p.delete('program_id')
    }
    p.set('page', '1')
    return `?${p.toString()}`
  }, [params])

  return (
    <div className="flex gap-2">
      <select
        className="form-input w-auto"
        onChange={(e) => {
          router.push(buildUrl({ status: e.target.value }))
        }}
        defaultValue={status || ''}
      >
        <option value="">All Status</option>
        <option value="NEW">New</option>
        <option value="CONTACTED">Contacted</option>
        <option value="FOLLOW_UP">Follow Up</option>
        <option value="QUALIFIED">Qualified</option>
        <option value="CONVERTED">Converted</option>
        <option value="LOST">Lost</option>
        <option value="DNC">DNC</option>
      </select>
      <input
        type="search"
        placeholder="Search leads..."
        className="form-input w-48"
        defaultValue={search || ''}
        onChange={(e) => {
          const val = e.target.value
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            router.push(buildUrl({ search: val }))
          }, 500)
        }}
      />
      <label className="flex items-center gap-1 text-xs text-muted ml-2">
        <input
          type="checkbox"
          defaultChecked={due === 'today'}
          onChange={(e) => {
            router.push(buildUrl({ due: e.target.checked ? 'today' : undefined }))
          }}
        />
        Today
      </label>
      {/* Event filter */}
      <select
        className="form-input w-auto"
        value={eventId || ''}
        onChange={(e) => {
          const val = e.target.value || undefined
          setEventId(val)
          setProgramId(undefined)
          router.push(buildUrl({ event_id: val, program_id: undefined }))
          // refresh programs
          if (val) {
            fetch(`/api/meta/programs?eventId=${encodeURIComponent(val)}`)
              .then(r=>r.json())
              .then((data:any) => setPrograms(Array.isArray(data) ? data : []))
              .catch(() => {})
          } else {
            setPrograms([])
          }
        }}
      >
        <option value="">All Events</option>
        {events.map((e:any)=>(<option key={e.id} value={e.id}>{e.season ? `${e.name} (${e.season})` : e.name}</option>))}
      </select>
      {/* Program filter */}
      <select
        className="form-input w-auto"
        value={programId || ''}
        onChange={(e) => {
          const val = e.target.value || undefined
          setProgramId(val)
          router.push(buildUrl({ program_id: val }))
        }}
        disabled={!eventId}
      >
        <option value="">All Programs</option>
        {programs.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
      </select>
    </div>
  )
}

"use client"
import { useEffect, useState } from 'react'
import { saveDisposition } from '@/actions/leads'

const outcomes = ['CONNECTED','NO_ANSWER','BUSY','WRONG_NUMBER','NOT_INTERESTED','INTERESTED','APPOINTMENT_SET'] as const
type Outcome = typeof outcomes[number]

export function DispositionSheet({ leadId, onDone }: { leadId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(true)
  const [outcome, setOutcome] = useState<Outcome>('CONNECTED')
  const [note, setNote] = useState('')
  const [dueAt, setDueAt] = useState<string>('')
  const [priority, setPriority] = useState<'LOW'|'MEDIUM'|'HIGH'>('MEDIUM')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // auto-focus for quick logging
    const t = setTimeout(() => {
      const el = document.getElementById('note') as HTMLTextAreaElement | null
      el?.focus()
    }, 100)
    return () => clearTimeout(t)
  }, [])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md bg-bg border border-white/10 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Disposition</h3>
          <button onClick={()=>setOpen(false)} aria-label="Close" className="text-muted">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm mb-1">Outcome</div>
            <div className="flex flex-wrap gap-2">
              {outcomes.map(o => (
                <button key={o} onClick={()=>setOutcome(o)} className={`px-2 py-1 rounded text-sm border ${o===outcome? 'bg-primary text-white border-transparent':'border-white/10'}`}>{o.replace('_',' ')}</button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="note" className="block text-sm">Note</label>
            <textarea id="note" className="w-full rounded bg-white/5 border border-white/10 p-2" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">Next follow-up</label>
              <input type="datetime-local" className="w-full rounded bg-white/5 border border-white/10 px-2 py-1" value={dueAt} onChange={e=>setDueAt(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm">Priority</label>
              <select className="w-full rounded bg-white/5 border border-white/10 px-2 py-1" value={priority} onChange={e=>setPriority(e.target.value as any)}>
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
              </select>
            </div>
          </div>
          <button disabled={submitting} onClick={async ()=>{
            setSubmitting(true)
            await saveDisposition({ leadId, outcome, note, nextFollowUpAt: dueAt || null, priority })
            setSubmitting(false)
            setOpen(false)
            onDone?.()
          }} className="w-full rounded bg-success text-black font-medium px-3 py-2">Save</button>
        </div>
      </div>
    </div>
  )
}

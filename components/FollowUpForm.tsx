"use client"
import { useState } from 'react'
import { createFollowup } from '@/actions/leads'

export function FollowUpForm({ leadId, onSaved }: { leadId: string; onSaved?: () => void }) {
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<'LOW'|'MEDIUM'|'HIGH'>('MEDIUM')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <form className="space-y-2" onSubmit={async (e)=>{
      e.preventDefault()
      setSaving(true)
      await createFollowup({ leadId, dueAt, priority, remark })
      setSaving(false)
      setDueAt(''); setRemark('')
      onSaved?.()
    }}>
      <div className="grid grid-cols-2 gap-2">
        <input required type="datetime-local" className="rounded bg-white/5 border border-white/10 px-2 py-1" value={dueAt} onChange={e=>setDueAt(e.target.value)} />
        <select className="rounded bg-white/5 border border-white/10 px-2 py-1" value={priority} onChange={e=>setPriority(e.target.value as any)}>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
        </select>
      </div>
      <textarea placeholder="Remark" className="w-full rounded bg-white/5 border border-white/10 p-2" rows={2} value={remark} onChange={e=>setRemark(e.target.value)} />
      <button disabled={saving} className="rounded bg-primary text-white px-3 py-2">Add Follow-up</button>
    </form>
  )
}

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
      const iso = new Date(dueAt).toISOString()
      await createFollowup({ leadId, dueAt: iso, priority, remark })
      setSaving(false)
      setDueAt(''); setRemark('')
      onSaved?.()
    }}>
      <div className="grid grid-cols-2 gap-2">
        <input required type="datetime-local" className="form-input" value={dueAt} onChange={e=>setDueAt(e.target.value)} />
        <select className="form-input" value={priority} onChange={e=>setPriority(e.target.value as any)}>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
        </select>
      </div>
      <textarea placeholder="Remark" className="form-input" rows={2} value={remark} onChange={e=>setRemark(e.target.value)} />
      <button disabled={saving} className="btn-primary">Add Follow-up</button>
    </form>
  )
}

"use client"
import { useState } from 'react'
import { createFollowup } from '@/actions/leads'
import { useRouter } from 'next/navigation'

export default function SetNextModal({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false)
  const [dueAt, setDueAt] = useState<string>('')
  const [priority, setPriority] = useState<'LOW'|'MEDIUM'|'HIGH'>('MEDIUM')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  return (
    <>
      <button onClick={()=>setOpen(true)} className="px-2 py-1 rounded bg-white/10 text-xs">Set Next</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50">
          <div className="w-full max-w-sm card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Set Next Follow-up</h3>
              <button onClick={()=>setOpen(false)} className="text-muted">✕</button>
            </div>
            <form className="space-y-2" onSubmit={async (e)=>{
              e.preventDefault()
              setSaving(true)
              const iso = new Date(dueAt).toISOString()
              await createFollowup({ leadId, dueAt: iso, priority, remark })
              setSaving(false)
              setOpen(false)
              router.refresh()
            }}>
              <input type="datetime-local" required className="form-input" value={dueAt} onChange={(e)=>setDueAt(e.target.value)} />
              <select className="form-input" value={priority} onChange={(e)=>setPriority(e.target.value as any)}>
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
              </select>
              <textarea className="form-input" rows={2} placeholder="Remark (optional)" value={remark} onChange={(e)=>setRemark(e.target.value)} />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={()=>setOpen(false)} className="px-3 py-2 rounded bg-white/10 text-sm">Cancel</button>
                <button disabled={saving || !dueAt} className="btn-primary text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}


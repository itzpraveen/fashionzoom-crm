"use client"
import { useEffect, useRef, useState, useTransition } from 'react'
import { createLead } from '@/actions/leads'
import { EventProgramPicker } from './EventProgramPicker'
import Modal from './Modal'
import Field from './Field'

type Props = { open: boolean; onClose: () => void }

export function AddLeadModal({ open, onClose }: Props) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [eventProgram, setEventProgram] = useState<{ event_id?: string; program_id?: string }>({})
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    primary_phone: '',
    alt_phone: '',
    email: '',
    city: '',
    address: '',
    pincode: '',
    source: 'Other',
    product_interest: '',
    tags: '',
    notes: '',
    consent: false,
  })

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      nameInputRef.current?.focus({ preventScroll: true })
    })
  }, [open])

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Add Lead" footer={null}>
      <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault()
          setError(null); setSuccess(null)
          start(async () => {
            try {
              const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
              const res = await createLead({
                full_name: form.full_name || undefined,
                primary_phone: form.primary_phone,
                alt_phone: form.alt_phone || undefined,
                email: form.email || undefined,
                city: form.city || undefined,
                address: form.address || undefined,
                pincode: form.pincode || undefined,
                source: form.source as any,
                product_interest: form.product_interest || undefined,
                tags,
                notes: form.notes || undefined,
                consent: !!form.consent,
                event_id: eventProgram.event_id,
                program_id: eventProgram.program_id,
              })
              if ((res as any)?.ok) {
                setSuccess('Lead created')
                setTimeout(() => { onClose(); }, 600)
              } else {
                setError((res as any)?.error || 'Failed to create lead')
              }
            } catch (e: any) {
              setError(e.message || 'Failed to create lead')
            }
          })
        }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="Name">
            <input ref={nameInputRef} className="form-input" value={form.full_name} onChange={e=>setForm(f=>({...f, full_name: e.target.value}))} />
          </Field>
          <Field label="Phone" required>
            <input required inputMode="tel" className="form-input" value={form.primary_phone} onChange={e=>setForm(f=>({...f, primary_phone: e.target.value}))} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="City">
            <input className="form-input" value={form.city} onChange={e=>setForm(f=>({...f, city: e.target.value}))} />
          </Field>
          <Field label="Source">
            <select className="form-input" value={form.source} onChange={e=>setForm(f=>({...f, source: e.target.value}))}>
              {['Facebook','Instagram','Website','WalkIn','Referral','Other'].map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Event & Program (optional)</div>
          <EventProgramPicker value={eventProgram} onChange={setEventProgram} />
        </div>
        <button type="button" onClick={()=>setShowAdvanced(s=>!s)} className="text-xs underline">{showAdvanced ? 'Hide' : 'Show'} advanced fields</button>
        {showAdvanced && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Alt phone">
                <input inputMode="tel" className="form-input" value={form.alt_phone} onChange={e=>setForm(f=>({...f, alt_phone: e.target.value}))} />
              </Field>
              <Field label="Email">
                <input type="email" className="form-input" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
              </Field>
            </div>
            <Field label="Address">
              <input className="form-input" value={form.address} onChange={e=>setForm(f=>({...f, address: e.target.value}))} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Pincode">
                <input inputMode="numeric" className="form-input" value={form.pincode} onChange={e=>setForm(f=>({...f, pincode: e.target.value}))} />
              </Field>
              <Field label="Product interest">
                <input className="form-input" value={form.product_interest} onChange={e=>setForm(f=>({...f, product_interest: e.target.value}))} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Tags (comma separated)">
                <input className="form-input" value={form.tags} onChange={e=>setForm(f=>({...f, tags: e.target.value}))} />
              </Field>
              <div className="flex items-end gap-2">
                <input id="consent" type="checkbox" checked={form.consent} onChange={(e)=>setForm(f=>({...f, consent: e.target.checked}))} />
                <label htmlFor="consent" className="text-sm">Consent to contact</label>
              </div>
            </div>
            <Field label="Notes">
              <textarea rows={2} className="form-input" value={form.notes} onChange={e=>setForm(f=>({...f, notes: e.target.value}))} />
            </Field>
          </div>
        )}
        {error && <p role="alert" aria-live="polite" className="text-danger text-sm">{error}</p>}
        {success && <p className="text-success text-sm">{success}</p>}
        <div className="flex gap-2">
          <button disabled={pending} className="btn-primary">Save</button>
          <button type="button" onClick={onClose} className="rounded bg-white/10 px-3 py-2">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

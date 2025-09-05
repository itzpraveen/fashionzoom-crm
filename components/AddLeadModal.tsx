"use client"
import { useState, useTransition } from 'react'
import { createLead } from '@/actions/leads'

type Props = { open: boolean; onClose: () => void }

export function AddLeadModal({ open, onClose }: Props) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-lg bg-surface border border-line rounded p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add Lead</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted">✕</button>
        </div>
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
            <div>
              <label className="block text-sm">Name</label>
              <input className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.full_name} onChange={e=>setForm(f=>({...f, full_name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">Phone*</label>
              <input required inputMode="tel" className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.primary_phone} onChange={e=>setForm(f=>({...f, primary_phone: e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">City</label>
              <input className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.city} onChange={e=>setForm(f=>({...f, city: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">Source</label>
              <select className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.source} onChange={e=>setForm(f=>({...f, source: e.target.value}))}>
                {['Facebook','Instagram','Website','WalkIn','Referral','Other'].map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
          <button type="button" onClick={()=>setShowAdvanced(s=>!s)} className="text-xs underline">{showAdvanced ? 'Hide' : 'Show'} advanced fields</button>
          {showAdvanced && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm">Alt phone</label>
                  <input inputMode="tel" className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.alt_phone} onChange={e=>setForm(f=>({...f, alt_phone: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm">Email</label>
                  <input type="email" className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-sm">Address</label>
                <input className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.address} onChange={e=>setForm(f=>({...f, address: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm">Pincode</label>
                  <input inputMode="numeric" className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.pincode} onChange={e=>setForm(f=>({...f, pincode: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm">Product interest</label>
                  <input className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.product_interest} onChange={e=>setForm(f=>({...f, product_interest: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm">Tags (comma separated)</label>
                  <input className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.tags} onChange={e=>setForm(f=>({...f, tags: e.target.value}))} />
                </div>
                <div className="flex items-end gap-2">
                  <input id="consent" type="checkbox" checked={form.consent} onChange={(e)=>setForm(f=>({...f, consent: e.target.checked}))} />
                  <label htmlFor="consent" className="text-sm">Consent to contact</label>
                </div>
              </div>
              <div>
                <label className="block text-sm">Notes</label>
                <textarea rows={2} className="w-full rounded bg-surface-2 border border-line px-3 py-2" value={form.notes} onChange={e=>setForm(f=>({...f, notes: e.target.value}))} />
              </div>
            </div>
          )}
          {error && <p role="alert" aria-live="polite" className="text-danger text-sm">{error}</p>}
          {success && <p className="text-success text-sm">{success}</p>}
          <div className="flex gap-2">
            <button disabled={pending} className="rounded bg-primary text-white px-4 py-2">Save</button>
            <button type="button" onClick={onClose} className="rounded bg-white/10 px-3 py-2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

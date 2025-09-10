"use client"
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { waLink } from '@/lib/phone'
import Modal from './Modal'
import Field from './Field'

type LeadLite = { id: string; full_name: string | null; primary_phone: string; email?: string | null }

function renderTemplate(body: string, lead: LeadLite) {
  return body
    .replace(/\{\{\s*name\s*\}\}/gi, lead.full_name || '')
}

export default function ComposeModal({ lead }: { lead: LeadLite }) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<'WHATSAPP'|'SMS'|'EMAIL'>('WHATSAPP')
  const [templates, setTemplates] = useState<any[]>([])
  const [templateId, setTemplateId] = useState<string>('')
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    if (!open) return
    supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }: { data: any[] | null }) => setTemplates(data || []))
  }, [open, supabase])

  const selected = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId])
  const preview = useMemo(() => selected ? renderTemplate(selected.body, lead) : '', [selected, lead])

  const onSend = () => {
    if (channel === 'WHATSAPP') {
      const url = waLink(lead.primary_phone, preview)
      window.open(url, '_blank')
    } else if (channel === 'SMS') {
      const url = `sms:${lead.primary_phone}?&body=${encodeURIComponent(preview)}`
      window.location.href = url
    } else if (channel === 'EMAIL') {
      const url = `mailto:${lead.email || ''}?subject=${encodeURIComponent(selected?.name || 'Message')}&body=${encodeURIComponent(preview)}`
      window.location.href = url
    }
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} className="btn-secondary text-sm">Compose</button>
      {open && (
        <Modal open={open} onClose={()=>setOpen(false)} title="Compose message" size="lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Field label="Channel">
              <select className="form-input" value={channel} onChange={(e)=>setChannel(e.target.value as any)}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </select>
            </Field>
            <Field label="Template" className="sm:col-span-2">
              <select className="form-input" value={templateId} onChange={(e)=>setTemplateId(e.target.value)}>
                <option value="">— Select —</option>
                {templates.filter(t => !t.channel || t.channel === channel).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Preview">
            <textarea className="form-input" rows={4} value={preview} onChange={()=>{}} readOnly />
          </Field>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={()=>setOpen(false)} className="btn-ghost text-sm">Cancel</button>
            <button disabled={!selected} onClick={onSend} className="btn-primary text-sm">Send</button>
          </div>
        </Modal>
      )}
    </>
  )
}

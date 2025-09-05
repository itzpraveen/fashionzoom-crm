"use client"
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client-with-retry'
import { waLink } from '@/lib/phone'

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
      .then(({ data }) => setTemplates(data || []))
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
      <button onClick={()=>setOpen(true)} className="rounded bg-white/10 px-3 py-2 text-sm">Compose</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50">
          <div className="w-full max-w-lg card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Compose message</h3>
              <button onClick={()=>setOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-muted">Channel</label>
                <select className="form-input" value={channel} onChange={(e)=>setChannel(e.target.value as any)}>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted">Template</label>
                <select className="form-input" value={templateId} onChange={(e)=>setTemplateId(e.target.value)}>
                  <option value="">— Select —</option>
                  {templates.filter(t => !t.channel || t.channel === channel).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted">Preview</label>
              <textarea className="form-input" rows={4} value={preview} onChange={()=>{}} readOnly />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={()=>setOpen(false)} className="px-3 py-2 rounded bg-white/10 text-sm">Cancel</button>
              <button disabled={!selected} onClick={onSend} className="btn-primary text-sm">Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

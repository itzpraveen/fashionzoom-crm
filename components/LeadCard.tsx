"use client"
import { maskPhone } from '@/lib/phone'
import { useRouter } from 'next/navigation'
import { BadgeScore } from './BadgeScore'

export type Lead = {
  id: string
  full_name: string | null
  city: string | null
  source: string
  score: number
  next_follow_up_at: string | null
  last_activity_at: string | null
  primary_phone: string
  status: string
}

export function LeadCard({ lead, role }: { lead: Lead; role?: 'TELECALLER'|'MANAGER'|'ADMIN' }) {
  const router = useRouter()
  return (
    <div className="bg-white/5 border border-white/10 rounded p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{lead.full_name || '—'}</div>
          <BadgeScore score={lead.score} />
          {lead.status === 'DNC' && <span className="text-xs text-danger ml-1">DNC</span>}
        </div>
        <div className="text-xs text-muted mt-0.5">
          <span>{lead.city || '—'}</span>
          <span className="mx-2">•</span>
          <span>{lead.source}</span>
        </div>
        <div className="text-xs text-muted mt-0.5">Next: {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : '—'}</div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${lead.primary_phone}`}
          className="touch-target rounded bg-white/10 px-3 py-2 text-sm"
          aria-label={`Call ${maskPhone(lead.primary_phone, role)}`}
        >Call</a>
        <a
          href={`https://wa.me/91${lead.primary_phone}`}
          target="_blank"
          className="touch-target rounded bg-white/10 px-3 py-2 text-sm"
          aria-label="WhatsApp"
        >WA</a>
        <button onClick={()=>router.push(`/leads/${lead.id}`)} className="touch-target rounded bg-primary text-black px-3 py-2 text-sm" aria-label="Open">Open</button>
      </div>
    </div>
  )
}


"use client"
import { maskPhone, waLink } from '@/lib/phone'
import { useRouter } from 'next/navigation'
import { BadgeScore } from './BadgeScore'
import { Phone, MessageCircle, ExternalLink } from 'lucide-react'
import { computeLeadScore } from '@/lib/scoring'
import { recommendNext } from '@/lib/recommendations'
import { computeSLA } from '@/lib/services/sla.service'

/**
 * Lead data structure for display in cards
 */
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

interface LeadCardProps {
  /** Lead data to display */
  lead: Lead
  /** User role for determining phone masking */
  role?: 'TELECALLER' | 'MANAGER' | 'ADMIN'
}

/**
 * Displays a lead in a card format with quick actions
 * 
 * Features:
 * - Phone number masking based on user role
 * - Quick call and WhatsApp actions
 * - Status badges and scoring display
 * - Responsive design for mobile and desktop
 * 
 * @example
 * ```tsx
 * <LeadCard lead={leadData} role="MANAGER" />
 * ```
 */
export function LeadCard({ lead, role }: LeadCardProps) {
  const router = useRouter()
  const masked = maskPhone(lead.primary_phone, role)
  const score = computeLeadScore({
    status: lead.status,
    last_activity_at: lead.last_activity_at,
    next_follow_up_at: lead.next_follow_up_at,
  })
  const rec = recommendNext({
    id: lead.id,
    full_name: lead.full_name,
    primary_phone: lead.primary_phone,
    status: lead.status,
    last_activity_at: lead.last_activity_at,
    next_follow_up_at: lead.next_follow_up_at,
    activities: [],
  })
  const sla = computeSLA({ status: lead.status, created_at: undefined, next_follow_up_at: lead.next_follow_up_at })
  return (
    <div className="bg-surface border border-line rounded p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{lead.full_name || '—'}</div>
          <BadgeScore score={score} />
          {lead.status === 'DNC' && <span className="text-xs text-danger ml-1">DNC</span>}
        </div>
        <div className="text-xs text-muted mt-0.5">{masked}</div>
        <div className="text-xs text-muted mt-0.5">
          <span>{lead.city || '—'}</span>
          <span className="mx-2">•</span>
          <span>{lead.source}</span>
        </div>
        <div className="text-xs text-muted mt-0.5">Next: {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : '—'}</div>
        <div className="text-xs mt-1">
          <span className={`mr-2 px-1.5 py-0.5 rounded ${sla.status==='OVERDUE'?'bg-danger/20 text-danger':sla.status==='DUE_SOON'?'bg-warning/20 text-warning':'bg-white/10'}`} title={sla.hint}>{sla.status}</span>
          <span title={rec.reason}>Next best: {rec.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${lead.primary_phone}`}
          className="touch-target rounded bg-white/10 px-3 py-2 text-sm flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-label={`Call ${masked}`}
        >
          <Phone size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Call</span>
        </a>
        <a
          href={waLink(lead.primary_phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="touch-target rounded bg-white/10 px-3 py-2 text-sm flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-label={`WhatsApp ${masked}`}
        >
          <MessageCircle size={16} aria-hidden="true" />
          <span className="hidden sm:inline">WA</span>
        </a>
        <button
          onClick={()=>router.push(`/leads/${lead.id}`)}
          className="touch-target btn-primary text-sm flex items-center gap-1"
          aria-label="Open lead"
        >
          <ExternalLink size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Open</span>
        </button>
      </div>
    </div>
  )
}

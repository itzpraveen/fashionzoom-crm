"use client"
import { maskPhone, waLink } from '@/lib/phone'
import { useRouter } from 'next/navigation'
import { BadgeScore } from './BadgeScore'
import { Phone, MessageCircle, ExternalLink } from 'lucide-react'

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
  return (
    <div className="bg-surface border border-line rounded p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{lead.full_name || '—'}</div>
          <BadgeScore score={lead.score} />
          {lead.status === 'DNC' && <span className="text-xs text-danger ml-1">DNC</span>}
        </div>
        <div className="text-xs text-muted mt-0.5">{masked}</div>
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
          className="touch-target rounded bg-primary text-white px-3 py-2 text-sm flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-label="Open lead"
        >
          <ExternalLink size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Open</span>
        </button>
      </div>
    </div>
  )
}

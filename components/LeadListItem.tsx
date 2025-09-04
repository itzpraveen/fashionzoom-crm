import Link from 'next/link'
import { BadgeScore } from './BadgeScore'
import { maskPhone } from '@/lib/phone'

export function LeadListItem({ lead, role }: { lead: any; role?: 'TELECALLER'|'MANAGER'|'ADMIN' }) {
  return (
    <tr className="border-b border-white/10">
      <td className="py-2 text-xs text-muted">{new Date(lead.created_at).toLocaleDateString()}</td>
      <td className="py-2"><Link className="hover:underline" href={`/leads/${lead.id}`}>{lead.full_name || '—'}</Link></td>
      <td className="py-2">{lead.city || '—'}</td>
      <td className="py-2">{lead.source}</td>
      <td className="py-2">{maskPhone(lead.primary_phone, role)}</td>
      <td className="py-2"><BadgeScore score={lead.score} /></td>
      <td className="py-2 text-xs text-muted">{lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : '—'}</td>
      <td className="py-2 text-xs text-muted">{lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleString() : '—'}</td>
    </tr>
  )
}


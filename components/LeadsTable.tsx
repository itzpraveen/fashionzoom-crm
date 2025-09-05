"use client"
import Link from 'next/link'
import { DataTable } from './DataTable'
import { normalizePhone, waLink } from '@/lib/phone'
import QuickNext from './QuickNext'
import MarkContactedButton from './MarkContactedButton'
import { computeLeadScore } from '@/lib/scoring'
import { recommendNext } from '@/lib/recommendations'
import { computeSLA } from '@/lib/services/sla.service'

export type LeadRow = {
  id: string
  full_name: string | null
  primary_phone: string
  city: string | null
  source: string
  status: string
  score: number
  next_follow_up_at: string | null
  created_at: string
  last_activity_at?: string | null
  notes?: string | null
  owner?: { full_name: string | null } | null
  activities?: { outcome: string | null; type: string; message?: string | null; created_at: string }[]
  followups?: { remark: string | null; created_at: string }[]
}

export default function LeadsTable({ leads, role }: { leads: LeadRow[]; role: 'TELECALLER'|'MANAGER'|'ADMIN' }) {
  const mask = (p: string) => {
    if (role === 'ADMIN' || role === 'MANAGER') {
      return normalizePhone(p) || p
    }
    const n = normalizePhone(p) || p
    return n.replace(/(\d{3})\d+(\d{2})/, (_, a, z) => `${a}•••${z}`)
  }
  return (
    <DataTable columns={["Name","Phone","City","Source","Status","Score","Next Best","SLA","Next","Last Contacted","Disposition","Owner","Remarks","Actions"]}>
      {leads.map((l) => {
        const phoneDisp = mask(l.primary_phone)
        const wa = waLink(l.primary_phone)
        const dispScore = computeLeadScore({
          status: l.status,
          source: l.source,
          last_activity_at: l.last_activity_at || null,
          next_follow_up_at: l.next_follow_up_at,
          activities: l.activities,
          followups: l.followups,
        })
        const rec = recommendNext({
          id: l.id,
          full_name: l.full_name,
          primary_phone: l.primary_phone,
          status: l.status,
          last_activity_at: l.last_activity_at || null,
          next_follow_up_at: l.next_follow_up_at,
          activities: l.activities,
        })
        const sla = computeSLA({ status: l.status, created_at: l.created_at, next_follow_up_at: l.next_follow_up_at })
        const lastAct = l.activities && l.activities[0]
        const remark = (l.followups && l.followups[0]?.remark) || l.notes || null
        return (
          <tr key={l.id} className="border-t border-white/10">
            <td className="py-2 pr-4">
              <Link href={`/leads/${l.id}`} className="hover:underline">{l.full_name || '—'}</Link>
            </td>
            <td className="py-2 pr-4 whitespace-nowrap">{phoneDisp}</td>
            <td className="py-2 pr-4">{l.city || '—'}</td>
            <td className="py-2 pr-4">{l.source}</td>
            <td className="py-2 pr-4">{l.status}</td>
            <td className="py-2 pr-4">{dispScore}</td>
            <td className="py-2 pr-4 whitespace-nowrap" title={rec.reason}>
              {rec.link ? <a href={rec.link} target="_blank" rel="noreferrer" className="underline">{rec.label}</a> : rec.label}
            </td>
            <td className="py-2 pr-4">
              <span className={`px-2 py-0.5 rounded text-xs ${sla.status==='OVERDUE'?'bg-danger/20 text-danger':sla.status==='DUE_SOON'?'bg-warning/20 text-warning':'bg-white/10'}`} title={sla.hint}>{sla.status}</span>
            </td>
            <td className="py-2 pr-4 whitespace-nowrap">{l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleString() : '—'}</td>
            <td className="py-2 pr-4 whitespace-nowrap" title={lastAct ? `${lastAct.type}${lastAct.outcome ? ' • ' + lastAct.outcome : ''}${lastAct.message ? '\n' + lastAct.message : ''}` : ''}>
              {l.last_activity_at ? new Date(l.last_activity_at).toLocaleString() : '—'}
            </td>
            <td className="py-2 pr-4">{lastAct?.outcome || '—'}</td>
            <td className="py-2 pr-4">{l.owner?.full_name || '—'}</td>
            <td className="py-2 pr-4 max-w-[16rem] truncate" title={remark || ''}>{remark || '—'}</td>
            <td className="py-2 pr-4">
              <div className="flex gap-2">
                <a href={`tel:${normalizePhone(l.primary_phone) || l.primary_phone}`} className="px-2 py-1 rounded bg-white/10 text-xs">Call</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded bg-white/10 text-xs">WA</a>
                <Link href={`/leads/${l.id}`} className="px-2 py-1 rounded bg-primary text-white text-xs">Open</Link>
                <QuickNext leadId={l.id} />
                <MarkContactedButton leadId={l.id} />
              </div>
            </td>
          </tr>
        )
      })}
    </DataTable>
  )
}

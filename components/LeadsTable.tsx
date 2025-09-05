"use client"
import Link from 'next/link'
import { DataTable } from './DataTable'
import { normalizePhone, waLink, simpleLeadScore } from '@/lib/phone'

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
    <DataTable columns={["Name","Phone","City","Source","Status","Score","Next","Last Contacted","Owner","Remarks","Actions"]}>
      {leads.map((l) => {
        const phoneDisp = mask(l.primary_phone)
        const wa = waLink(l.primary_phone)
        const dispScore = simpleLeadScore(l.status, l.last_activity_at || undefined)
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
            <td className="py-2 pr-4 whitespace-nowrap">{l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleString() : '—'}</td>
            <td className="py-2 pr-4 whitespace-nowrap">{l.last_activity_at ? new Date(l.last_activity_at).toLocaleString() : '—'}</td>
            <td className="py-2 pr-4">{l.owner?.full_name || '—'}</td>
            <td className="py-2 pr-4 max-w-[16rem] truncate" title={l.notes || ''}>{l.notes || '—'}</td>
            <td className="py-2 pr-4">
              <div className="flex gap-2">
                <a href={`tel:${normalizePhone(l.primary_phone) || l.primary_phone}`} className="px-2 py-1 rounded bg-white/10 text-xs">Call</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded bg-white/10 text-xs">WA</a>
                <Link href={`/leads/${l.id}`} className="px-2 py-1 rounded bg-primary text-white text-xs">Open</Link>
              </div>
            </td>
          </tr>
        )
      })}
    </DataTable>
  )
}

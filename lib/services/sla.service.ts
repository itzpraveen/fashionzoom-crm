export type SLAStatus = 'OK' | 'DUE_SOON' | 'OVERDUE'

export function computeSLA(lead: {
  status: string
  created_at?: string
  next_follow_up_at?: string | null
}): { status: SLAStatus; hint: string } {
  const now = Date.now()
  const next = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null

  // NEW leads: contact within 2 hours of creation
  if (lead.status === 'NEW' && lead.created_at) {
    const created = new Date(lead.created_at).getTime()
    const hoursSince = (now - created) / (1000 * 60 * 60)
    if (hoursSince > 2) return { status: 'OVERDUE', hint: 'First contact >2h' }
    if (hoursSince > 1) return { status: 'DUE_SOON', hint: 'Contact within 1h' }
  }

  if (next != null) {
    const diffH = (next - now) / (1000 * 60 * 60)
    if (diffH < 0) return { status: 'OVERDUE', hint: 'Follow-up overdue' }
    if (diffH <= 24) return { status: 'DUE_SOON', hint: 'Due within 24h' }
  }

  return { status: 'OK', hint: 'On track' }
}


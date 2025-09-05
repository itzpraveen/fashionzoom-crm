export type LeadLike = {
  status: string
  source?: string | null
  last_activity_at?: string | null
  next_follow_up_at?: string | null
  created_at?: string
  activities?: { outcome: string | null; type: string; created_at: string }[]
  followups?: { remark: string | null; created_at: string }[]
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso).getTime()
  if (isNaN(d)) return null
  return (Date.now() - d) / (1000 * 60 * 60 * 24)
}

function hoursUntil(iso?: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso).getTime()
  if (isNaN(d)) return null
  return (d - Date.now()) / (1000 * 60 * 60)
}

export function computeLeadScore(lead: LeadLike): number {
  let score = 50

  // Status weight
  switch (lead.status) {
    case 'NEW': score += 15; break
    case 'CONTACTED': score += 10; break
    case 'FOLLOW_UP': score += 20; break
    case 'QUALIFIED': score += 30; break
    case 'CONVERTED': score = 100; break
    case 'LOST': score -= 20; break
    case 'DNC': score = 0; break
  }

  // Source quality
  const source = (lead.source || '').toUpperCase()
  if (source.includes('REFERRAL')) score += 10
  else if (source.includes('WEBSITE')) score += 6
  else if (source.includes('WALK')) score += 4
  else if (source.includes('FACEBOOK') || source.includes('INSTAGRAM')) score += 2

  // Recency decay (last activity)
  const days = daysSince(lead.last_activity_at)
  if (days != null) score -= Math.min(35, Math.floor(days))

  // Upcoming/overdue follow-up influences urgency
  const h = hoursUntil(lead.next_follow_up_at)
  if (h != null) {
    if (h < 0) score += 12 // overdue → more urgent
    else if (h < 24) score += 6
  }

  // Attempts: too many recent attempts reduce marginal value
  const attempts = lead.activities?.filter(a => a.type === 'CALL' || a.type === 'WHATSAPP')?.length || 0
  if (attempts >= 3) score -= 6

  // Pending follow-up gets a small bump
  if ((lead.followups?.length || 0) > 0) score += 3

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function priorityKey(lead: LeadLike): number {
  // Higher is more priority
  const base = computeLeadScore(lead)
  const h = hoursUntil(lead.next_follow_up_at)
  const overdueBoost = h != null && h < 0 ? 20 : 0
  return base + overdueBoost
}


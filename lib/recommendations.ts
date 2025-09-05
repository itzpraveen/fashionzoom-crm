import { computeLeadScore } from './scoring'
import { waLink } from './phone'

export type Recommendation = {
  action: 'CALL' | 'WHATSAPP' | 'FOLLOW_UP' | 'NURTURE'
  label: string
  reason: string
  when: 'now' | 'today' | 'later'
  link?: string
}

export function recommendNext(lead: {
  id: string
  full_name: string | null
  primary_phone: string
  status: string
  last_activity_at?: string | null
  next_follow_up_at?: string | null
  activities?: { outcome: string | null; type: string; created_at: string }[]
}) : Recommendation {
  const score = computeLeadScore(lead)
  const now = Date.now()
  const next = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null
  const overdue = next != null && next < now
  const lastAct = lead.activities?.[0]
  const hadCall = lastAct?.type === 'CALL'

  if (lead.status === 'NEW' || overdue) {
    return {
      action: 'CALL',
      label: 'Call now',
      reason: overdue ? 'Follow-up overdue' : 'New lead — fast response wins',
      when: 'now'
    }
  }

  if (score >= 70 && !hadCall) {
    return {
      action: 'CALL',
      label: 'Call today',
      reason: 'High score and no recent call',
      when: 'today'
    }
  }

  if (score >= 60) {
    return {
      action: 'WHATSAPP',
      label: 'Send WA template',
      reason: 'Warm lead — gentle nudge works',
      when: 'today',
      link: waLink(lead.primary_phone)
    }
  }

  return {
    action: 'FOLLOW_UP',
    label: 'Set follow-up for +3d',
    reason: 'Low intent — space it out',
    when: 'later'
  }
}


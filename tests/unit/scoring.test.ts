import { describe, it, expect } from 'vitest'
import { computeLeadScore, priorityKey } from '../../lib/scoring'

describe('scoring', () => {
  it('boosts NEW and penalizes stale activity', () => {
    const scoreFresh = computeLeadScore({ status: 'NEW', last_activity_at: new Date().toISOString() })
    const scoreStale = computeLeadScore({ status: 'NEW', last_activity_at: new Date(Date.now() - 7*24*3600*1000).toISOString() })
    expect(scoreFresh).toBeGreaterThan(scoreStale)
  })

  it('gives high score for QUALIFIED and max for CONVERTED', () => {
    const q = computeLeadScore({ status: 'QUALIFIED' })
    const c = computeLeadScore({ status: 'CONVERTED' })
    expect(q).toBeLessThanOrEqual(100)
    expect(c).toBe(100)
  })

  it('adds priority for overdue follow-up', () => {
    const overdue = priorityKey({ status: 'FOLLOW_UP', next_follow_up_at: new Date(Date.now() - 3600*1000).toISOString() })
    const future = priorityKey({ status: 'FOLLOW_UP', next_follow_up_at: new Date(Date.now() + 24*3600*1000).toISOString() })
    expect(overdue).toBeGreaterThan(future)
  })
})


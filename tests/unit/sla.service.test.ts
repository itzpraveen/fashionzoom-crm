import { describe, it, expect } from 'vitest'
import { computeSLA } from '../../lib/services/sla.service'

describe('SLA service', () => {
  it('flags overdue follow-ups', () => {
    const { status } = computeSLA({ status: 'FOLLOW_UP', next_follow_up_at: new Date(Date.now()-3600*1000).toISOString() })
    expect(status).toBe('OVERDUE')
  })
  it('flags NEW older than 2h', () => {
    const { status } = computeSLA({ status: 'NEW', created_at: new Date(Date.now()-3*3600*1000).toISOString() })
    expect(status).toBe('OVERDUE')
  })
})


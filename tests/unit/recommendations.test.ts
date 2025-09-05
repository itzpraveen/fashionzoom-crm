import { describe, it, expect } from 'vitest'
import { recommendNext } from '../../lib/recommendations'

describe('recommendations', () => {
  it('recommends call for new or overdue', () => {
    const r1 = recommendNext({ id: '1', full_name: null, primary_phone: '99999', status: 'NEW', activities: [] })
    expect(r1.action).toBe('CALL')
    const r2 = recommendNext({ id: '2', full_name: null, primary_phone: '99999', status: 'FOLLOW_UP', next_follow_up_at: new Date(Date.now()-3600*1000).toISOString(), activities: [] })
    expect(r2.action).toBe('CALL')
  })

  it('suggests WA for warm leads', () => {
    const r = recommendNext({ id: '3', full_name: null, primary_phone: '99999', status: 'CONTACTED', activities: [] })
    expect(['CALL','WHATSAPP','FOLLOW_UP']).toContain(r.action)
  })
})


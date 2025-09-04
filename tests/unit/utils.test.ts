import { describe, it, expect } from 'vitest'
import { normalizePhone, buildWhatsAppMessage, simpleLeadScore } from '../../lib/phone'

describe('phone utils', () => {
  it('normalizes indian phones', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('9876543210')
    expect(normalizePhone('09876543210')).toBe('9876543210')
    expect(normalizePhone('9876543210')).toBe('9876543210')
  })
  it('builds WA message', () => {
    expect(buildWhatsAppMessage('Aarav')).toContain('Aarav')
  })
  it('scores lead roughly', () => {
    expect(simpleLeadScore('NEW')).toBeGreaterThan(simpleLeadScore('LOST'))
  })
})

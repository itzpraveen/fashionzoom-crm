import { describe, it, expect } from 'vitest'
import { parseCsv, dedupeByNormalizedPhone } from '../../../lib/utils/csv'

function normalizePhone(p?: string | null): string | null {
  if (!p) return null
  const digits = p.replace(/\D/g, '')
  const stripped = digits.replace(/^(91|0)+/, '')
  return stripped.length > 10 ? stripped.slice(-10) : stripped
}

describe('csv utils', () => {
  it('parses quoted CSV and preserves commas', () => {
    const csv = 'name,phone,city\n"Doe, John",+91 98765-43210,\"Kochi\"\nJane,09876543210,Calicut\n'
    const { header, rows } = parseCsv(csv)
    expect(header).toEqual(['name', 'phone', 'city'])
    expect(rows.length).toBe(2)
    expect(rows[0][0]).toBe('Doe, John')
    expect(rows[0][1]).toContain('98765')
  })

  it('dedupes by normalized phone', () => {
    const rows = [
      { name: 'A', phone: '+91 9876543210' },
      { name: 'B', phone: '09876543210' },
      { name: 'C', phone: '9876543210' },
    ]
    const out = dedupeByNormalizedPhone(rows as any, 'phone', normalizePhone)
    expect(out.length).toBe(1)
    expect(out[0].name).toBe('A')
  })
})

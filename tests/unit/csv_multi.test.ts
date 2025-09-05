import { describe, it, expect } from 'vitest'
import { dedupeByPhones } from '../../lib/utils/csv'

function norm(p?: string | null) {
  if (!p) return null
  let n = p.replace(/\D/g, '')
  n = n.replace(/^0+/, '') // drop leading 0s
  n = n.replace(/^91/, '') // drop country code
  return n
}

describe('CSV multi-phone dedupe', () => {
  it('removes rows that duplicate on any phone field', () => {
    const rows = [
      { name: 'A', phone: '+91 98765 43210', alt: '' },
      { name: 'B', phone: '09876543210', alt: '' }, // dup of A after normalization
      { name: 'C', phone: '5555', alt: '919876543210' }, // dup of A on alt
      { name: 'D', phone: '8888', alt: '' },
    ]
    const out = dedupeByPhones(rows, ['phone','alt'], norm)
    expect(out.map(r => r.name)).toEqual(['A','D'])
  })
})

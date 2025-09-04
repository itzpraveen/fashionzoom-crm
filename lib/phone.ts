export function normalizePhone(p?: string | null): string | null {
  if (!p) return null
  const digits = p.replace(/\D/g, '')
  const stripped = digits.replace(/^(91|0)+/, '')
  return stripped.length > 10 ? stripped.slice(-10) : stripped
}

export function maskPhone(p?: string | null, role?: 'TELECALLER'|'MANAGER'|'ADMIN'): string {
  const n = normalizePhone(p) || ''
  if (!n) return ''
  if (role === 'MANAGER' || role === 'ADMIN') return n
  // mask e.g. 98•••40••• when 10 digits
  if (n.length === 10) return n.replace(/(\d{2})(\d{3})(\d{2})(\d{3})/, (_, a,b,c,d) => `${a}\u2022\u2022\u2022${c}\u2022\u2022\u2022`)
  // Fallback: reveal first 2 and last 2 digits, mask middle
  return n.replace(/^(\d{2})(.*)(\d{2})$/, (_, a, mid, z) => `${a}${'\u2022'.repeat(Math.max(3, mid.length))}${z}`)
}

export function waLink(phone: string, message?: string) {
  const n = normalizePhone(phone)
  const base = n ? `https://wa.me/91${n}` : `https://wa.me/`
  if (message) return `${base}?text=${encodeURIComponent(message)}`
  return base
}

export function buildWhatsAppMessage(name?: string) {
  return `Hello${name ? ' ' + name : ''}! This is FashionZoom. Can we talk now?`
}

export function simpleLeadScore(status: string, lastActivityAt?: string | null) {
  let score = 50
  if (status === 'NEW') score += 10
  if (status === 'CONTACTED') score += 5
  if (status === 'QUALIFIED') score += 15
  if (status === 'CONVERTED') score = 100
  if (lastActivityAt) {
    const days = (Date.now() - new Date(lastActivityAt).getTime()) / 86400000
    score -= Math.min(30, Math.floor(days))
  }
  return Math.max(0, Math.min(100, score))
}

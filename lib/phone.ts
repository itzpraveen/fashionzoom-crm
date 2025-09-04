export function normalizePhone(p?: string | null): string | null {
  if (!p) return null
  const digits = p.replace(/\D/g, '')
  return digits.replace(/^(91|0)+/, '')
}

export function maskPhone(p?: string | null, role?: 'TELECALLER'|'MANAGER'|'ADMIN'): string {
  const n = normalizePhone(p) || ''
  if (!n) return ''
  if (role === 'MANAGER' || role === 'ADMIN') return n
  // mask e.g. 98•••40•••
  return n.replace(/(\d{2})(\d{3})(\d{2})(\d{3})/, (_, a,b,c,d) => `${a}\u2022\u2022\u2022${c}\u2022\u2022\u2022`)
}

export function waLink(phone: string, message?: string) {
  const n = normalizePhone(phone)
  const base = `https://wa.me/91${n}`
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


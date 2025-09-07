export type AppRole = 'TELECALLER'|'MANAGER'|'ADMIN'

export function normalizeRole(input: unknown): AppRole {
  const s = String(input ?? '').trim().toUpperCase()
  if (s === 'ADMIN' || s === 'SUPERADMIN' || s === 'SUPER_ADMIN' || s === 'OWNER') return 'ADMIN'
  if (s === 'MANAGER' || s === 'LEAD' || s === 'TEAM_LEAD') return 'MANAGER'
  return 'TELECALLER'
}


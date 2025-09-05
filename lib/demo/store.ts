// Simple in-memory demo store with a tiny API
// Not production-grade. Only for NEXT_PUBLIC_DEMO=1 local/demo runs.

// Avoid node-only crypto for browser compatibility
function uuid() {
  const g: any = globalThis as any
  if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID()
  // eslint-disable-next-line no-bitwise
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function stableUuidFromIndex(i: number) {
  const hex = Math.max(1, i).toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${hex}`
}

export type DemoUser = {
  id: string
  email: string
  full_name: string
  role: 'TELECALLER'|'MANAGER'|'ADMIN'
  team_id: string | null
}

type Row = Record<string, any>

type Tables = {
  profiles: Row[]
  teams: Row[]
  leads: Row[]
  activities: Row[]
  followups: Row[]
  templates: Row[]
  assignment_rules: Row[]
  events: Row[]
  programs: Row[]
  lead_enrollments: Row[]
}

let seeded = false
let loggedIn = true

export const ids = {
  user: '00000000-0000-4000-8000-000000000001',
  team: '11111111-1111-4111-8111-111111111111'
}

export const demoUser: DemoUser = {
  id: ids.user,
  email: 'demo@fzcrm.local',
  full_name: 'Demo Admin',
  role: 'ADMIN',
  team_id: ids.team
}

const tables: Tables = {
  profiles: [],
  teams: [],
  leads: [],
  activities: [],
  followups: [],
  templates: [],
  assignment_rules: [],
  events: [],
  programs: [],
  lead_enrollments: []
}

function nowIso(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString()
}

export function seedIfNeeded() {
  if (seeded) return
  seeded = true
  // Teams
  tables.teams.push({ id: ids.team, name: 'Demo Team', created_at: nowIso(-60) })
  // Profiles
  tables.profiles.push({ id: demoUser.id, full_name: demoUser.full_name, role: demoUser.role, team_id: demoUser.team_id, created_at: nowIso(-60) })
  // Templates
  tables.templates.push(
    { id: uuid(), channel: 'WhatsApp', name: 'First touch', body: 'Hello {{name}}, this is FashionZoom.' , created_at: nowIso(-50)},
    { id: uuid(), channel: 'SMS', name: 'Follow-up', body: 'Can we talk now?', created_at: nowIso(-40) }
  )
  // Assignment rules
  tables.assignment_rules.push({ id: uuid(), name: 'Round-robin', strategy: 'ROUND_ROBIN', is_active: true, created_at: nowIso(-30) })
  // Events & Programs
  const ev1 = { id: uuid(), name: 'Fashion Week', season: 'SS25', team_id: ids.team, created_at: nowIso(-120) }
  const ev2 = { id: uuid(), name: 'Resort Showcase', season: '2025', team_id: ids.team, created_at: nowIso(-110) }
  tables.events.push(ev1, ev2)
  const pr1 = { id: uuid(), event_id: ev1.id, name: 'Designer Runway', created_at: nowIso(-119) }
  const pr2 = { id: uuid(), event_id: ev1.id, name: 'Sponsor Platinum', created_at: nowIso(-118) }
  const pr3 = { id: uuid(), event_id: ev2.id, name: 'Buyer Preview', created_at: nowIso(-109) }
  tables.programs.push(pr1, pr2, pr3)
  // Leads
  const basePhones = ['9876543210','9123456789','9988776655','9801122334','9911223344','9900112233','9898989898','9797979797','9090909090','9000000001','9000000002','9000000003']
  basePhones.forEach((p, i) => {
    const id = stableUuidFromIndex(i + 1)
    const created_at = nowIso(-120 + i * 5)
    const next = i % 3 === 0 ? nowIso(-30) : i % 3 === 1 ? nowIso(60) : null
    tables.leads.push({
      id,
      full_name: `Lead ${i+1}`,
      city: ['Kochi','Kozhikode','Thiruvananthapuram'][i % 3],
      source: ['Facebook','Instagram','Website','Referral'][i % 4],
      score: 60 - i,
      next_follow_up_at: next,
      last_activity_at: created_at,
      primary_phone: p,
      status: 'NEW',
      is_deleted: false,
      owner_id: demoUser.id,
      team_id: demoUser.team_id,
      created_at
    })
    if (i % 4 === 0) {
      tables.lead_enrollments.push({ id: uuid(), lead_id: id, event_id: ev1.id, program_id: pr1.id, status: 'INTERESTED', created_at: created_at, updated_at: created_at })
    }
    if (next) {
      tables.followups.push({ id: uuid(), lead_id: id, user_id: demoUser.id, due_at: next, priority: ['LOW','MEDIUM','HIGH'][i%3], remark: 'Reminder', status: 'PENDING', created_at })
    }
  })
}

export function getTable<T = Row>(name: keyof Tables): T[] {
  seedIfNeeded()
  // @ts-expect-error runtime index
  return tables[name]
}

export function setLoggedIn(v: boolean) { loggedIn = v }
export function isLoggedIn() { return loggedIn }

export function upsertRow(table: keyof Tables, row: Row, conflictKey?: string, ignoreDuplicates?: boolean) {
  const arr = getTable(table)
  if (!conflictKey) {
    arr.push(row)
    return { inserted: 1, updated: 0 }
  }
  const idx = arr.findIndex((r) => String(r[conflictKey]) === String(row[conflictKey]))
  if (idx === -1) {
    arr.push(row)
    return { inserted: 1, updated: 0 }
  }
  if (ignoreDuplicates) {
    return { inserted: 0, updated: 0 }
  }
  arr[idx] = { ...arr[idx], ...row }
  return { inserted: 0, updated: 1 }
}

export function updateRows(table: keyof Tables, filter: (r: Row) => boolean, patch: Row) {
  const arr = getTable(table)
  let count = 0
  for (let i=0;i<arr.length;i++) {
    const r = arr[i]
    if (filter(r)) {
      arr[i] = { ...r, ...patch }
      count++
    }
  }
  return count
}

export function insertRows(table: keyof Tables, rows: Row[]) {
  const arr = getTable(table)
  arr.push(...rows)
}

export function removeRows(table: keyof Tables, filter: (r: Row) => boolean) {
  const arr = getTable(table)
  const remain = arr.filter(r => !filter(r))
  ;(tables as any)[table] = remain
}

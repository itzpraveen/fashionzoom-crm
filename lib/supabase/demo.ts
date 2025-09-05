// A tiny mock of the supabase client used by the app for Demo Mode.
// It supports a minimal subset of: auth.getUser/exchangeCodeForSession/signOut,
// from(...).select/eq/lt/gte/is/order/limit/single/maybeSingle,
// insert(...).select().single(), update(...).eq(...), upsert(...).select().
import { demoUser, getTable, insertRows, isLoggedIn, setLoggedIn, updateRows, upsertRow } from '../demo/store'

// Safe UUID generator that works in both browser and Node without `node:crypto`
function uuid() {
  // Prefer Web Crypto if available (browser)
  const g: any = globalThis as any
  if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID()
  // Fallback to a simple RFC4122-ish generator (not cryptographically secure)
  // eslint-disable-next-line no-bitwise
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
import { normalizePhone } from '../phone'

type Row = Record<string, any>

function by<T extends Row>(preds: ((r: T) => boolean)[]) {
  return (r: T) => preds.every(p => p(r))
}

function cmpVal(v: any) {
  // simple helper to compare ISO timestamps properly
  if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).getTime()
  return v
}

class SelectBuilder<T extends Row> {
  private preds: ((r: T) => boolean)[] = []
  private orderField: string | null = null
  private asc = true
  private limitN: number | null = null
  private start: number | null = null
  private end: number | null = null
  private wantCount = false
  private orExpr: string | null = null
  constructor(private table: keyof ReturnType<typeof tablesMap>) {}
  select(_columns?: string, opts?: { count?: 'exact'|'planned'|'estimated' }) { this.wantCount = opts?.count === 'exact'; return this }
  eq<K extends keyof T & string>(k: K, v: any) { this.preds.push((r:any)=> String(r[k])===String(v)); return this }
  in<K extends keyof T & string>(k: K, arr: any[]) { const set = new Set((arr||[]).map(String)); this.preds.push((r:any)=> set.has(String(r[k]))); return this }
  lt<K extends keyof T & string>(k: K, v: any) { const vv = cmpVal(v); this.preds.push((r:any)=> cmpVal(r[k]) < vv); return this }
  gte<K extends keyof T & string>(k: K, v: any) { const vv = cmpVal(v); this.preds.push((r:any)=> cmpVal(r[k]) >= vv); return this }
  is<K extends keyof T & string>(k: K, v: any) { this.preds.push((r:any)=> r[k] === v); return this }
  order(field: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) { this.orderField = field; this.asc = opts?.ascending !== false; return this }
  limit(n: number) { this.limitN = n; return this }
  range(start: number, end: number) { this.start = start; this.end = end; return this }
  or(expr: string) { this.orExpr = expr; return this }
  async single() { const { data } = await this.run(); return { data: (data[0] ?? null), error: null as any } }
  async maybeSingle() { const { data } = await this.run(); return { data: (data[0] ?? null), error: null as any } }
  then(resolve: (v: any)=>void, _reject?: (e:any)=>void) { this.run().then(resolve) }
  async run() {
    const arr: T[] = getTable(this.table as any) as any
    let out = arr.filter(by<T>(this.preds))
    if (this.orExpr) {
      const parts = this.orExpr.split(',').map(s => s.trim()).filter(Boolean)
      const orPreds = parts.map((p) => {
        // pattern: field.ilike.%term%
        const m = p.match(/([^\.]+)\.ilike\.%(.+)%/)
        if (!m) return (_r: any) => true
        const field = m[1]
        const term = m[2].toLowerCase()
        return (r: any) => String(r[field] || '').toLowerCase().includes(term)
      })
      out = out.filter((r:any) => orPreds.some(fn => fn(r)))
    }
    if (this.orderField) {
      const f = this.orderField
      const dir = this.asc ? 1 : -1
      out = out.slice().sort((a: any, b: any) => cmpVal(a[f]) < cmpVal(b[f]) ? -1*dir : cmpVal(a[f]) > cmpVal(b[f]) ? 1*dir : 0)
    }
    const total = out.length
    if (this.start != null && this.end != null) {
      out = out.slice(this.start, this.end + 1)
    } else if (this.limitN != null) {
      out = out.slice(0, this.limitN)
    }
    return { data: out as any, error: null as any, count: this.wantCount ? total : null }
  }
}

class InsertBuilder<T extends Row> {
  constructor(private table: keyof ReturnType<typeof tablesMap>, private rows: T[]) {}
  select(_cols?: string) { return { single: async () => ({ data: this.rows[0] ?? null, error: null as any }) } }
  then(resolve: (v:any)=>void) { resolve({ data: this.rows, error: null as any }) }
}

class UpsertBuilder<T extends Row> {
  private opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}
  constructor(private table: keyof ReturnType<typeof tablesMap>, private rows: T[]) {}
  select(_cols?: string) {
    return { then: (resolve: (v:any)=>void) => resolve({ data: this.rows.map(r=>({ id: r.id })), error: null as any }) }
  }
  onConflict(k: string) { this.opts.onConflict = k; return this }
  then(resolve: (v:any)=>void) { resolve({ data: this.rows, error: null as any }) }
}

class UpdateBuilder<T extends Row> {
  private filter: (r: T) => boolean = () => true
  constructor(private table: keyof ReturnType<typeof tablesMap>, private patch: Partial<T>) {}
  eq<K extends keyof T & string>(k: K, v: any) { this.filter = (r:any)=> String(r[k])===String(v); return this }
  then(resolve: (v:any)=>void) {
    const count = updateRows(this.table as any, this.filter as any, this.patch as any)
    resolve({ data: { count }, error: null as any })
  }
}

class DeleteBuilder<T extends Row> {
  private filter: (r: T) => boolean = () => false
  constructor(private table: keyof ReturnType<typeof tablesMap>) {}
  eq<K extends keyof T & string>(k: K, v: any) { this.filter = (r:any)=> String(r[k])===String(v); return this }
  then(resolve: (v:any)=>void) {
    removeRows(this.table as any, this.filter as any)
    resolve({ data: null, error: null as any })
  }
}

function tablesMap() {
  return {
    profiles: getTable('profiles'),
    teams: getTable('teams'),
    leads: getTable('leads'),
    activities: getTable('activities'),
    followups: getTable('followups'),
    templates: getTable('templates'),
    assignment_rules: getTable('assignment_rules'),
    events: getTable('events'),
    programs: getTable('programs'),
    lead_enrollments: getTable('lead_enrollments')
  }
}

export function createDemoSupabase() {
  const api = {
    auth: {
      async getUser() {
        return { data: { user: isLoggedIn() ? { id: demoUser.id, email: demoUser.email, user_metadata: { name: demoUser.full_name } } : null } }
      },
      async exchangeCodeForSession(_code: string) { setLoggedIn(true); return { data: {}, error: null as any } },
      async signOut() { setLoggedIn(false); return { error: null as any } },
      // client only
      async signInWithOtp(_args: any) { setLoggedIn(true); return { data: {}, error: null as any } },
      async verifyOtp(_args: any) { setLoggedIn(true); return { data: {}, error: null as any } },
      onAuthStateChange(_cb: any) { return { data: { subscription: { unsubscribe(){} } } } }
    },
    from<T extends Row>(name: keyof ReturnType<typeof tablesMap>) {
      const table = name
      return {
        select: (_cols?: string) => new SelectBuilder<T>(table).select(_cols),
        // allow chaining eq/lt/gte/is/order/limit on select builder
        eq: (k: string, v: any) => new SelectBuilder<T>(table).select('*').eq(k as any, v),
        insert: (payload: T | T[]) => {
          const rows = Array.isArray(payload) ? payload : [payload]
          const enriched = rows.map((r: any) => {
            const id = r.id ?? uuid()
            const created_at = r.created_at ?? new Date().toISOString()
            if (name === 'leads') {
              r.score = typeof r.score === 'number' ? r.score : 50
              r.status = r.status || 'NEW'
            }
            return { ...r, id, created_at }
          })
          insertRows(name as any, enriched)
          return new InsertBuilder<T>(table, enriched as any)
        },
        update: (patch: Partial<T>) => new UpdateBuilder<T>(table, patch),
        upsert: (payload: T | T[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
          const rows = Array.isArray(payload) ? payload : [payload]
          const out: any[] = []
          for (const r of rows) {
            const row: any = { ...r }
            if (name === 'leads') {
              const key = opts?.onConflict || 'primary_phone'
              const normKey = key.includes('primary_phone_norm') ? 'primary_phone' : key
              row[normKey] = row[normKey]
              const conflictVal = normKey === 'primary_phone' ? (normalizePhone(row[normKey]) || row[normKey]) : row[normKey]
              row.id = row.id ?? uuid()
              upsertRow(name as any, { ...row, [normKey]: conflictVal }, normKey, opts?.ignoreDuplicates)
              out.push({ id: row.id })
            } else {
              row.id = row.id ?? uuid()
              upsertRow(name as any, row, 'id', opts?.ignoreDuplicates)
              out.push({ id: row.id })
            }
          }
          return new UpsertBuilder<T>(table, out as any)
        }
        ,
        delete: () => new DeleteBuilder<T>(table)
      }
    }
  }
  return api as any
}

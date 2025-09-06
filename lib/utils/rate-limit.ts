// Lightweight rate limiter with Redis (Upstash) support and in-memory fallback.
// Usage: await rateLimit({ key: `user:${userId}:create`, limit: 20, windowMs: 5000 })

type Options = { key: string; limit: number; windowMs: number }

// In-memory fallback store with TTL and max entries to avoid leaks
const mem = new Map<string, { count: number; resetAt: number }>()
const MEM_MAX_KEYS = 5000

function sweepMemory() {
  const now = Date.now()
  for (const [k, v] of mem) {
    if (now >= v.resetAt) mem.delete(k)
  }
  // Bound map size by removing oldest keys if needed
  if (mem.size > MEM_MAX_KEYS) {
    const toRemove = mem.size - MEM_MAX_KEYS
    let i = 0
    for (const k of mem.keys()) {
      mem.delete(k)
      if (++i >= toRemove) break
    }
  }
}

async function redisRateLimit(opts: Options): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return false
  try {
    // Use atomic INCR + EXPIRE if first hit within window
    const key = `rl:${opts.key}`
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!incrRes.ok) return false
    const { result: count } = await incrRes.json()
    if (count === 1) {
      // First hit: set expiry (seconds)
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${Math.ceil(opts.windowMs / 1000)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }).catch(() => null)
    }
    return count <= opts.limit
  } catch {
    return false
  }
}

function memoryRateLimit(opts: Options): boolean {
  sweepMemory()
  const now = Date.now()
  const rec = mem.get(opts.key)
  if (!rec || now >= rec.resetAt) {
    mem.set(opts.key, { count: 1, resetAt: now + opts.windowMs })
    return true
  }
  rec.count += 1
  return rec.count <= opts.limit
}

export async function rateLimit(opts: Options): Promise<void> {
  const allowed = (await redisRateLimit(opts)) || memoryRateLimit(opts)
  if (!allowed) throw new Error('Too many requests, slow down')
}


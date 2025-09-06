interface CacheEntry<T> {
  data: T
  expiresAt: number // epoch ms
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private sweeper: ReturnType<typeof setInterval> | null = null
  
  constructor(
    private defaultTTL: number = 60000, // 1 minute default
    private maxSize: number = 100,
    private sweepInterval: number = 30000 // 30s
  ) {
    this.sweeper = setInterval(() => this.sweep(), this.sweepInterval)
  }
  
  set<T>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl ?? this.defaultTTL
    // LRU: move key to the end by deleting then setting
    if (this.cache.has(key)) this.cache.delete(key)
    this.cache.set(key, { data, expiresAt: Date.now() + actualTTL })
    // Evict least-recently-used if beyond max size
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value as string | undefined
      if (!oldestKey) break
      this.cache.delete(oldestKey)
    }
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    // LRU bump: move to end
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.data as T
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
  
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  private sweep(): void {
    const now = Date.now()
    for (const [k, v] of this.cache) {
      if (now >= v.expiresAt) this.cache.delete(k)
    }
  }
  
  dispose(): void {
    if (this.sweeper) clearInterval(this.sweeper)
    this.sweeper = null
    this.clear()
  }
  
  // Utility method to create a cache key from multiple parts
  static createKey(...parts: any[]): string {
    return parts.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':')
  }
}

// Singleton instance for app-wide caching
export const appCache = new MemoryCache()

// Cache decorator for async functions
export function cached(ttl?: number, keyGenerator?: (...args: any[]) => string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator 
        ? keyGenerator(...args)
        : MemoryCache.createKey(target.constructor.name, propertyKey, ...args)
      
      // Check cache first
      const cached = appCache.get(cacheKey)
      if (cached !== null) {
        return cached
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args)
      
      // Cache result
      appCache.set(cacheKey, result, ttl)
      
      return result
    }
    
    return descriptor
  }
}

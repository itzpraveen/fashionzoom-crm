interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private timers = new Map<string, NodeJS.Timeout>()
  
  constructor(
    private defaultTTL: number = 60000, // 1 minute default
    private maxSize: number = 100
  ) {}
  
  set<T>(key: string, data: T, ttl?: number): void {
    // Clear existing timer if any
    this.clearTimer(key)
    
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestKey()
      if (oldestKey) this.delete(oldestKey)
    }
    
    const actualTTL = ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTTL
    })
    
    // Set auto-expiry timer
    if (actualTTL > 0) {
      const timer = setTimeout(() => this.delete(key), actualTTL)
      this.timers.set(key, timer)
    }
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  delete(key: string): boolean {
    this.clearTimer(key)
    return this.cache.delete(key)
  }
  
  clear(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
  
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  private clearTimer(key: string): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }
  
  private findOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    })
    
    return oldestKey
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
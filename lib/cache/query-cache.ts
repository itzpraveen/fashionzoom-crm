import { MemoryCache } from './memory-cache'

// Specialized cache for database queries
export class QueryCache {
  private cache: MemoryCache
  
  constructor() {
    // Query results cached for 30 seconds by default
    this.cache = new MemoryCache(30000, 200)
  }
  
  // Generate cache key for leads queries
  leadsKey(params: {
    ownerId?: string
    teamId?: string
    status?: string
    search?: string
    page?: number
    pageSize?: number
  }): string {
    return MemoryCache.createKey('leads', params)
  }
  
  // Generate cache key for single lead
  leadKey(id: string): string {
    return MemoryCache.createKey('lead', id)
  }
  
  // Generate cache key for activities
  activitiesKey(leadId: string): string {
    return MemoryCache.createKey('activities', leadId)
  }
  
  // Generate cache key for dashboard stats
  statsKey(params: { userId?: string; teamId?: string; date?: string }): string {
    return MemoryCache.createKey('stats', params)
  }
  
  // Get cached query result
  get<T>(key: string): T | null {
    return this.cache.get<T>(key)
  }
  
  // Set query result with optional TTL
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, data, ttl)
  }
  
  // Invalidate related cache entries
  invalidateLeads(ownerId?: string, teamId?: string): void {
    const keysToDelete = this.cache.keys().filter(key => {
      if (!key.startsWith('leads:')) return false
      
      // Parse the cached params
      try {
        const [, paramsStr] = key.split(':', 2)
        const params = JSON.parse(paramsStr)
        
        // Invalidate if owner or team matches
        if (ownerId && params.ownerId === ownerId) return true
        if (teamId && params.teamId === teamId) return true
        
        return false
      } catch {
        return false
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
  
  // Invalidate single lead and related queries
  invalidateLead(leadId: string, ownerId?: string): void {
    // Delete the specific lead
    this.cache.delete(this.leadKey(leadId))
    
    // Delete activities for this lead
    this.cache.delete(this.activitiesKey(leadId))
    
    // Invalidate owner's lead lists
    if (ownerId) {
      this.invalidateLeads(ownerId)
    }
  }
  
  // Invalidate all stats
  invalidateStats(): void {
    const keysToDelete = this.cache.keys().filter(key => key.startsWith('stats:'))
    keysToDelete.forEach(key => this.cache.delete(key))
  }
  
  // Clear entire cache
  clear(): void {
    this.cache.clear()
  }
  
  // Get cache stats
  getStats() {
    return {
      size: this.cache.size(),
      keys: this.cache.keys()
    }
  }
}

// Singleton instance
export const queryCache = new QueryCache()

// React hook for cache-aware queries (client-side)
import React from 'react'

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [state, setState] = React.useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({
    data: queryCache.get<T>(key),
    loading: false,
    error: null
  })
  
  const refetch = React.useCallback(async () => {
    if (options.enabled === false) return
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await fetcher()
      queryCache.set(key, data, options.ttl)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Query failed') 
      }))
    }
  }, [key, fetcher, options.ttl, options.enabled])
  
  React.useEffect(() => {
    if (options.enabled === false) return
    
    // If no cached data, fetch
    if (!state.data) {
      refetch()
    }
  }, [options.enabled, state.data, refetch])
  
  return { ...state, refetch }
}

// Server-side cache-aware query wrapper
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Fetch and cache
  const data = await fetcher()
  queryCache.set(key, data, ttl)
  
  return data
}

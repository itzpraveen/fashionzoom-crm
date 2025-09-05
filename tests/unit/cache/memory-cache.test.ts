import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { MemoryCache, cached } from '../../../lib/cache/memory-cache'

describe('MemoryCache', () => {
  let cache: MemoryCache
  
  beforeEach(() => {
    vi.useFakeTimers()
    cache = new MemoryCache(1000, 3) // 1 second TTL, max 3 items
  })
  
  afterEach(() => {
    vi.useRealTimers()
    cache.clear()
  })
  
  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })
    
    it('should store complex objects', () => {
      const obj = { name: 'test', data: [1, 2, 3] }
      cache.set('obj', obj)
      expect(cache.get('obj')).toEqual(obj)
    })
    
    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })
    
    it('should override existing values', () => {
      cache.set('key', 'value1')
      cache.set('key', 'value2')
      expect(cache.get('key')).toBe('value2')
    })
  })
  
  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('temp', 'data', 500) // 500ms TTL
      
      expect(cache.get('temp')).toBe('data')
      
      // Advance time by 600ms
      vi.advanceTimersByTime(600)
      
      expect(cache.get('temp')).toBeNull()
    })
    
    it('should auto-delete expired entries', () => {
      cache.set('auto', 'delete', 300)
      
      expect(cache.has('auto')).toBe(true)
      
      // Advance time to trigger auto-deletion
      vi.advanceTimersByTime(400)
      
      expect(cache.has('auto')).toBe(false)
      expect(cache.size()).toBe(0)
    })
    
    it('should use default TTL when not specified', () => {
      cache.set('default', 'ttl')
      
      expect(cache.get('default')).toBe('ttl')
      
      // Advance by default TTL (1000ms)
      vi.advanceTimersByTime(1100)
      
      expect(cache.get('default')).toBeNull()
    })
  })
  
  describe('size limits', () => {
    it('should evict oldest entry when full', () => {
      cache.set('first', 1)
      vi.advanceTimersByTime(100)
      cache.set('second', 2)
      vi.advanceTimersByTime(100)
      cache.set('third', 3)
      vi.advanceTimersByTime(100)
      
      // Cache is full (max 3), adding fourth should evict first
      cache.set('fourth', 4)
      
      expect(cache.get('first')).toBeNull()
      expect(cache.get('second')).toBe(2)
      expect(cache.get('third')).toBe(3)
      expect(cache.get('fourth')).toBe(4)
      expect(cache.size()).toBe(3)
    })
    
    it('should not evict when updating existing key', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      
      // Update existing key shouldn't trigger eviction
      cache.set('b', 22)
      
      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(22)
      expect(cache.get('c')).toBe(3)
      expect(cache.size()).toBe(3)
    })
  })
  
  describe('delete and clear', () => {
    it('should delete specific entries', () => {
      cache.set('del1', 'value1')
      cache.set('del2', 'value2')
      
      expect(cache.delete('del1')).toBe(true)
      expect(cache.get('del1')).toBeNull()
      expect(cache.get('del2')).toBe('value2')
    })
    
    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false)
    })
    
    it('should clear all entries', () => {
      cache.set('c1', 1)
      cache.set('c2', 2)
      cache.set('c3', 3)
      
      cache.clear()
      
      expect(cache.size()).toBe(0)
      expect(cache.get('c1')).toBeNull()
      expect(cache.get('c2')).toBeNull()
      expect(cache.get('c3')).toBeNull()
    })
  })
  
  describe('utility methods', () => {
    it('should list all keys', () => {
      cache.set('k1', 1)
      cache.set('k2', 2)
      cache.set('k3', 3)
      
      const keys = cache.keys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('k1')
      expect(keys).toContain('k2')
      expect(keys).toContain('k3')
    })
    
    it('should create composite keys', () => {
      const key = MemoryCache.createKey('user', 123, { status: 'active' })
      expect(key).toBe('user:123:{"status":"active"}')
    })
  })
  
  describe('cached decorator', () => {
    it('should cache method results', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      
      class TestService {
        @cached(2000)
        async getData(id: number) {
          return mockFn(id)
        }
      }
      
      const service = new TestService()
      
      // First call should execute function
      const result1 = await service.getData(1)
      expect(result1).toBe('result')
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      // Second call should return cached value
      const result2 = await service.getData(1)
      expect(result2).toBe('result')
      expect(mockFn).toHaveBeenCalledTimes(1) // Not called again
      
      // Different argument should execute function
      const result3 = await service.getData(2)
      expect(result3).toBe('result')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
})

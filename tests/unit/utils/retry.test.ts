import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../../../lib/utils/retry'

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    
    const result = await withRetry(mockFn)
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  
  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success')
    
    const onRetry = vi.fn()
    
    const result = await withRetry(mockFn, {
      maxAttempts: 3,
      delay: 10,
      onRetry
    })
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error))
  })
  
  it('should throw after max attempts', async () => {
    const error = new Error('Always fails')
    const mockFn = vi.fn().mockRejectedValue(error)
    
    await expect(
      withRetry(mockFn, { maxAttempts: 2, delay: 10 })
    ).rejects.toThrow('Always fails')
    
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
  
  it('should not retry if shouldRetry returns false', async () => {
    const error = new Error('Do not retry')
    const mockFn = vi.fn().mockRejectedValue(error)
    
    await expect(
      withRetry(mockFn, {
        shouldRetry: () => false,
        delay: 10
      })
    ).rejects.toThrow('Do not retry')
    
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  
  it('should use exponential backoff', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success')
    
    const start = Date.now()
    
    await withRetry(mockFn, {
      maxAttempts: 3,
      delay: 100,
      backoff: 'exponential'
    })
    
    const duration = Date.now() - start
    
    // First retry after 100ms, second after 200ms = 300ms total minimum
    expect(duration).toBeGreaterThanOrEqual(300)
    expect(duration).toBeLessThan(400) // Some buffer for execution time
  })
  
  it('should use linear backoff', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success')
    
    const start = Date.now()
    
    await withRetry(mockFn, {
      maxAttempts: 3,
      delay: 100,
      backoff: 'linear'
    })
    
    const duration = Date.now() - start
    
    // First retry after 100ms, second after 200ms = 300ms total minimum
    expect(duration).toBeGreaterThanOrEqual(300)
    expect(duration).toBeLessThan(400)
  })
  
  it('should retry on network errors by default', async () => {
    const networkError = { code: 'ECONNREFUSED' }
    const mockFn = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success')
    
    const result = await withRetry(mockFn, { delay: 10 })
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
  
  it('should retry on 5xx errors by default', async () => {
    const serverError = { status: 503 }
    const mockFn = vi.fn()
      .mockRejectedValueOnce(serverError)
      .mockResolvedValue('success')
    
    const result = await withRetry(mockFn, { delay: 10 })
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
  
  it('should not retry on 4xx errors by default', async () => {
    const clientError = { status: 404 }
    const mockFn = vi.fn().mockRejectedValue(clientError)
    
    await expect(
      withRetry(mockFn, { delay: 10 })
    ).rejects.toEqual(clientError)
    
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

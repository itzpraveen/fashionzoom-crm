interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  shouldRetry?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  shouldRetry: (error) => {
    // Don't retry on explicit 4xx client errors
    if (error?.status >= 400 && error?.status < 500) return false
    // Retry on network-ish errors and everything else by default
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') return true
    if (error?.status >= 500 && error?.status < 600) return true
    if (typeof error?.status === 'number') return true
    if (error?.message?.includes('fetch failed')) return true
    return true
  },
  onRetry: () => {}
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error
      }
      
      opts.onRetry(attempt, error)
      
      const delay = opts.backoff === 'exponential' 
        ? opts.delay * Math.pow(2, attempt - 1)
        : opts.delay * attempt
        
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Retry decorator for class methods
export function retry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options)
    }

    return descriptor
  }
}

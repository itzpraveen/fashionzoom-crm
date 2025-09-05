import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { withRetry } from '@/lib/utils/retry'

export function createBrowserClient() {
  const client = _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Wrap key methods with retry logic
  const originalFrom = client.from.bind(client)
  client.from = (table: string) => {
    const query = originalFrom(table)
    
    // Wrap select, insert, update, delete with retry
    const wrapMethod = (method: string) => {
      const original = (query as any)[method]
      if (typeof original === 'function') {
        ;(query as any)[method] = function(...args: any[]) {
          const result = original.apply(this, args)
          
          // Intercept the promise chain
          const originalThen = result.then
          result.then = function(onFulfilled: any, onRejected: any) {
            return originalThen.call(
              this,
              onFulfilled,
              async (error: any) => {
                // Retry logic
                const shouldRetry = error?.code === 'PGRST301' || // network error
                                  error?.code === '500' ||
                                  error?.message?.includes('Failed to fetch')
                
                if (shouldRetry && (window as any).__retryCount < 3) {
                  (window as any).__retryCount = ((window as any).__retryCount || 0) + 1
                  console.log(`Retrying request (attempt ${(window as any).__retryCount})...`)
                  
                  // Wait before retry
                  await new Promise(resolve => 
                    setTimeout(resolve, 1000 * (window as any).__retryCount)
                  )
                  
                  // Retry the entire query
                  return original.apply(query, args)
                }
                
                // Reset retry count on final failure
                (window as any).__retryCount = 0
                
                if (onRejected) return onRejected(error)
                throw error
              }
            )
          }
          
          return result
        }
      }
    }
    
    wrapMethod('select')
    wrapMethod('insert')
    wrapMethod('update')
    wrapMethod('delete')
    wrapMethod('upsert')
    
    return query
  }
  
  return client
}
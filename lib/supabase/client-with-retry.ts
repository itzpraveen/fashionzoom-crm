import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

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
          const invoke = () => original.apply(this, args)
          const thenable = {
            then(onFulfilled: any, onRejected: any) {
              const run = async (attempt: number): Promise<any> => {
                try {
                  return await invoke()
                } catch (error: any) {
                  const shouldRetry =
                    error?.code === 'PGRST301' ||
                    error?.code === '500' ||
                    error?.message?.includes('Failed to fetch')
                  if (shouldRetry && attempt < 3) {
                    const delay = 1000 * attempt
                    await new Promise(r => setTimeout(r, delay))
                    return run(attempt + 1)
                  }
                  throw error
                }
              }
              return run(1).then(onFulfilled, onRejected)
            }
          }
          return thenable as any
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

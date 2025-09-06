import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createDemoSupabase } from '@/lib/supabase/demo'

// Wrap a Postgrest builder in a Proxy that only overrides `.then` to add retries,
// while preserving the fluent API (eq, gte, order, etc.).
function wrapBuilder<T extends object>(builder: any): any {
  const originalThen = builder && typeof builder.then === 'function' ? builder.then.bind(builder) : undefined
  if (!originalThen) return builder

  const proxy = new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return function thenWithRetry(onFulfilled?: any, onRejected?: any) {
          const exec = () => new Promise((resolve, reject) => originalThen(resolve, reject))
          const run = async (attempt: number): Promise<any> => {
            try {
              return await exec()
            } catch (error: any) {
              const msg = String(error?.message || '')
              const shouldRetry =
                error?.code === 'PGRST301' ||
                error?.code === '500' ||
                msg.includes('Failed to fetch') ||
                msg.includes('NetworkError')
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

      const value: any = Reflect.get(target, prop, receiver)
      if (typeof value === 'function') {
        return function wrappedMethod(this: any, ...args: any[]) {
          const out = value.apply(target, args)
          // Methods in the chain return another builder (thenable). Re-wrap it.
          if (out && typeof out === 'object' && 'then' in out) return wrapBuilder(out as any)
          return out
        }
      }
      return value
    }
  })
  return proxy
}

export function createBrowserClient() {
  // In Demo Mode, use the in-memory demo supabase client so we don't
  // require real Supabase env vars in the browser.
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEMO === '1') {
    return createDemoSupabase() as any
  }

  const client = _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any

  // Return a client whose `.from()` wraps builders with retry-on-then.
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return function fromWithRetry(this: any, ...args: any[]) {
          const builder = (target as any).from(...args)
          return wrapBuilder(builder)
        }
      }
      const value: any = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
}

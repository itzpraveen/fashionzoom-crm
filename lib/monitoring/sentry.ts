// Optional Sentry helpers; package not required at build time
import { config } from '@/lib/config'
// Placeholder to avoid hard dependency on '@sentry/nextjs' at build time
const Sentry: any = null

export function initSentry() {
  const dsn = config.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn || !Sentry) return
  // If Sentry is available and DSN configured, initialize (no-op in this build)
}

// Helper to capture exceptions with additional context
export function captureException(error: Error, context?: Record<string, any>) {
  console.error('Captured exception:', error, context)
  
  if (!config.NEXT_PUBLIC_SENTRY_DSN || !Sentry) {
    return
  }
  
  Sentry.withScope((scope: any) => {
    if (context) {
      scope.setContext('additional', context)
    }
    Sentry.captureException(error)
  })
}

// Helper to track custom events
export function trackEvent(name: string, data?: Record<string, any>) {
  if (!config.NEXT_PUBLIC_SENTRY_DSN || !Sentry) {
    return
  }
  
  Sentry.addBreadcrumb({
    category: 'custom',
    message: name,
    level: 'info',
    data,
  })
}

// Helper to measure performance
export function measurePerformance<T>(
  name: string,
  operation: () => T | Promise<T>
): T | Promise<T> {
  if (!config.NEXT_PUBLIC_SENTRY_DSN) {
    return operation()
  }
  
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
  const span = transaction?.startChild({
    op: 'custom',
    description: name,
  })
  
  try {
    const result = operation()
    
    if (result instanceof Promise) {
      return result.finally(() => span?.finish())
    }
    
    span?.finish()
    return result
  } catch (error) {
    span?.setStatus('internal_error')
    span?.finish()
    throw error
  }
}

// User identification for better error tracking
export function identifyUser(user: { id: string; email?: string; role?: string }) {
  if (!config.NEXT_PUBLIC_SENTRY_DSN || !Sentry) {
    return
  }
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  })
}

// Clear user on logout
export function clearUser() {
  if (!config.NEXT_PUBLIC_SENTRY_DSN || !Sentry) {
    return
  }
  
  Sentry.setUser(null)
}

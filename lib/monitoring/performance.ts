// Performance monitoring utilities

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  
  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers()
    }
  }
  
  private initializeObservers() {
    // Observe Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('LCP', lastEntry.startTime, 'ms')
    })
    
    // Observe First Input Delay
    this.observeMetric('first-input', (entries) => {
      const firstEntry: any = entries[0]
      const inputDelay = firstEntry.processingStart - (firstEntry.startTime as number)
      this.recordMetric('FID', inputDelay, 'ms')
    })
    
    // Observe Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      let cls = 0
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value
        }
      })
      this.recordMetric('CLS', cls, 'score')
    })
  }
  
  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ entryTypes: [type] })
      this.observers.set(type, observer)
    } catch (e) {
      console.warn(`Failed to observe ${type}:`, e)
    }
  }
  
  recordMetric(name: string, value: number, unit: string = 'ms') {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    }
    
    this.metrics.push(metric)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric: ${name} = ${value}${unit}`)
    }
    
    // Send to analytics if configured
    this.sendToAnalytics(metric)
  }
  
  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to Google Analytics if configured
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance', {
        event_category: 'Web Vitals',
        event_label: metric.name,
        value: Math.round(metric.value),
        metric_unit: metric.unit
      })
    }
    
    // Send to PostHog if configured
    if (typeof window !== 'undefined' && 'posthog' in window) {
      (window as any).posthog.capture('performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit
      })
    }
  }
  
  measureNavigation(routeName: string) {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(`Navigation:${routeName}`, duration, 'ms')
    }
  }
  
  measureApiCall(endpoint: string) {
    const startTime = performance.now()
    
    return (success: boolean = true) => {
      const duration = performance.now() - startTime
      this.recordMetric(
        `API:${endpoint}:${success ? 'success' : 'failure'}`,
        duration,
        'ms'
      )
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
  
  clearMetrics() {
    this.metrics = []
  }
  
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.metrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions
export function measureComponentRender(componentName: string) {
  const startTime = performance.now()
  
  return () => {
    const duration = performance.now() - startTime
    performanceMonitor.recordMetric(`Render:${componentName}`, duration, 'ms')
  }
}

export function measureDatabaseQuery(queryName: string) {
  const startTime = performance.now()
  
  return (rowCount?: number) => {
    const duration = performance.now() - startTime
    performanceMonitor.recordMetric(`DB:${queryName}`, duration, 'ms')
    
    if (rowCount !== undefined) {
      performanceMonitor.recordMetric(`DB:${queryName}:rows`, rowCount, 'count')
    }
  }
}

// React hook for measuring component performance
import React from 'react'

export function usePerformance(componentName: string) {
  if (typeof window === 'undefined') return
  
  React.useEffect(() => {
    const cleanup = measureComponentRender(componentName)
    return cleanup
  }, [componentName])
}

// HOC for measuring component performance
export function withPerformance<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Unknown'
  
  const WrappedComponent = (props: P) => {
    usePerformance(displayName)
    return React.createElement(Component, props)
  }
  
  WrappedComponent.displayName = `withPerformance(${displayName})`
  
  return WrappedComponent
}

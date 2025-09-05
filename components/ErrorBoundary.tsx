'use client'
import React, { Component, ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  /** Child components to render */
  children: ReactNode
  /** Optional custom error UI. If not provided, uses default error UI */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component that catches JavaScript errors in child components
 * 
 * Features:
 * - Catches errors during render, lifecycle methods, and constructors
 * - Displays user-friendly error message
 * - Provides reset functionality to recover from errors
 * - Optional custom error UI via fallback prop
 * - Logs errors to console in development
 * 
 * @example
 * ```tsx
 * // With default error UI
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With custom error UI
 * <ErrorBoundary 
 *   fallback={(error, reset) => (
 *     <div>Error: {error.message} <button onClick={reset}>Retry</button></div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.reset}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                className="rounded bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
"use client"
import { useEffect } from 'react'

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NEXT_PUBLIC_ENABLE_PWA !== '1') return
    if ('serviceWorker' in navigator) {
      const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
      // Defer registration to after load/idle to avoid competing with TTI
      const g: any = globalThis as any
      if ('requestIdleCallback' in g) {
        g.requestIdleCallback(register)
      } else {
        g.addEventListener?.('load', register, { once: true })
      }
    }
  }, [])
  return null
}

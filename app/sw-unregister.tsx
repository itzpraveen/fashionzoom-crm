"use client"
import { useEffect } from 'react'

export default function SWUnregister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister().catch(()=>{}))
      }).catch(()=>{})
    }
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(()=>{})
    }
  }, [])
  return null
}


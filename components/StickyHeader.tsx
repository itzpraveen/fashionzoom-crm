"use client"
import { useEffect, useState } from 'react'

export default function StickyHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 2)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className={`${className || ''} ${stuck ? 'shadow-[0_1px_0_0_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)]' : 'shadow-transparent'} transition-shadow duration-300`}>
      {children}
    </div>
  )
}


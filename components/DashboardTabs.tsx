"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

type Tab = { href: string; label: string; badge?: number | null }

export default function DashboardTabs({ initialQueueCount }: { initialQueueCount?: number }) {
  const pathname = usePathname()
  const [tabs, setTabs] = useState<Tab[]>([
    { href: '/dashboard/overview', label: 'Overview', badge: null },
    { href: '/dashboard/queue', label: 'My Queue', badge: typeof initialQueueCount === 'number' ? initialQueueCount : null },
    { href: '/dashboard/performance', label: 'Performance', badge: null },
  ])

  useEffect(() => {
    const supabase = createBrowserClient()
    let mounted = true
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const now = new Date().toISOString()
      // Overdue count for My Queue
      const { count } = await supabase
        .from('followups')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'PENDING')
        .lt('due_at', now)
      if (!mounted) return
      setTabs((t) => t.map(x => x.href === '/dashboard/queue' ? { ...x, badge: count ?? 0 } : x))
    }
    // If server provided initial badge value, avoid duplicating the fetch on mount
    if (typeof initialQueueCount !== 'number') load()
    return () => { mounted = false }
  }, [initialQueueCount])

  return (
    <div className="flex items-center justify-between">
      <nav
        className="inline-flex gap-1 rounded-lg bg-white/3 p-1 ring-1 ring-inset ring-white/10 backdrop-blur"
        aria-label="Dashboard tabs"
        role="tablist"
      >
        {tabs.map(({ href, label, badge }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              role="tab"
              aria-selected={active}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                active ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'text-fg/80 hover:bg-white/10'
              }`}
            >
              <span>{label}</span>
              {typeof badge === 'number' && badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-primary/25 text-primary text-[11px] px-1">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

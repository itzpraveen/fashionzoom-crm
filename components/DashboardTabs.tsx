"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

type Tab = { href: string; label: string; badge?: number | null }

export default function DashboardTabs() {
  const pathname = usePathname()
  const [tabs, setTabs] = useState<Tab[]>([
    { href: '/dashboard/overview', label: 'Overview', badge: null },
    { href: '/dashboard/queue', label: 'My Queue', badge: null },
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
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="border-b border-white/10">
      {/* Rely on the parent page container; avoid nested padding to keep tabs aligned with titles */}
      <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Dashboard tabs">
        {tabs.map(({ href, label, badge }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={`px-3 py-2 border-b-2 flex items-center gap-2 ${active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-fg'}`}
            >
              <span>{label}</span>
              {typeof badge === 'number' && badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] px-1">
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

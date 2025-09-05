"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard/overview', label: 'Overview' },
  { href: '/dashboard/queue', label: 'My Queue' },
  { href: '/dashboard/performance', label: 'Performance' },
]

export default function DashboardTabs() {
  const pathname = usePathname()
  return (
    <div className="border-b border-white/10">
      <nav className="mx-auto max-w-6xl px-4 -mb-px flex gap-4 overflow-x-auto" aria-label="Dashboard tabs">
        {tabs.map(({ href, label }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={`px-3 py-2 border-b-2 ${active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-fg'}`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}


"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string }
const items: Item[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/followups', label: 'Follow-ups' },
  { href: '/import', label: 'Import' },
  { href: '/settings/templates', label: 'Settings' },
  { href: '/settings/teams', label: 'Teams' },
]

export default function TopNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Top" className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-sm">
      <Link href="/dashboard" className="font-semibold tracking-tight flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary font-bold">FZ</span>
        FashionZoom CRM
      </Link>
      <div className="ml-auto hidden sm:flex items-center gap-3">
        {items.map(({ href, label }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={active ? 'text-primary' : 'hover:underline'}
              prefetch
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


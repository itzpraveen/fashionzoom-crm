"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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
  const router = useRouter()
  const onSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = (e.target as HTMLInputElement).value.trim()
      if (!q) return
      router.push(`/leads?search=${encodeURIComponent(q)}&view=table`)
    }
  }
  return (
    <nav aria-label="Top" className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3 text-sm">
      <Link href="/dashboard" className="font-semibold tracking-tight flex items-center gap-2">
        {/* Show themed logo if available; fallback to badge */}
        <picture className="inline-flex h-6 w-auto">
          <source srcSet="/brand/logo-dark.png" media="(prefers-color-scheme: dark)" />
          <img src="/brand/logo-light.png" alt="FashionZoom CRM" className="h-6 w-auto" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} />
        </picture>
        <span className="hidden sm:inline">FashionZoom CRM</span>
      </Link>
      <div className="ml-auto hidden sm:flex items-center gap-3">
        <input
          type="search"
          placeholder="Search leads…"
          className="form-input w-56"
          onKeyDown={onSearch}
        />
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

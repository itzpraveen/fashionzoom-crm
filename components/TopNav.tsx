"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, FileText, Upload, ListChecks, LogOut, Settings as SettingsIcon } from 'lucide-react'

const mainItems: { href: string; label: string }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/followups', label: 'Follow-ups' },
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
        {/* Hide text label to avoid double branding */}
      </Link>
      {/* Desktop nav */}
      <div className="ml-auto hidden sm:flex items-center gap-3">
        <input
          type="search"
          placeholder="Search leads…"
          className="form-input w-56"
          onKeyDown={onSearch}
        />
        {mainItems.map(({ href, label }) => {
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
        <details className="relative">
          <summary className="list-none cursor-pointer hover:underline inline-flex items-center gap-1">
            <SettingsIcon size={16} aria-hidden="true" /> Settings
          </summary>
          <div className="absolute right-0 mt-2 min-w-56 rounded-lg border border-white/10 bg-surface shadow-xl shadow-black/30 p-1 z-50">
            <nav className="flex flex-col text-sm" aria-label="Settings" role="menu">
              <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/teams" prefetch role="menuitem">
                <Users size={16} aria-hidden="true" /> <span>Teams</span>
              </Link>
              <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/templates" prefetch role="menuitem">
                <FileText size={16} aria-hidden="true" /> <span>Templates</span>
              </Link>
              <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/import" prefetch role="menuitem">
                <Upload size={16} aria-hidden="true" /> <span>Import</span>
              </Link>
              <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/assignment-rules" prefetch role="menuitem">
                <ListChecks size={16} aria-hidden="true" /> <span>Assignment Rules</span>
              </Link>
              <div className="my-1 border-t border-white/10" />
              <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-danger/20 text-danger" href="/logout" prefetch role="menuitem">
                <LogOut size={16} aria-hidden="true" /> <span>Logout</span>
              </Link>
            </nav>
          </div>
        </details>
      </div>
      {/* Mobile menu */}
      <details className="ml-auto sm:hidden">
        <summary className="list-none cursor-pointer rounded bg-white/10 px-3 py-2">Menu</summary>
        <div className="mt-2 w-56 card p-2">
          <nav className="flex flex-col text-sm" aria-label="Mobile navigation">
            <Link className="px-2 py-1 rounded hover:bg-white/10" href="/dashboard" prefetch>Dashboard</Link>
            <Link className="px-2 py-1 rounded hover:bg-white/10" href="/leads" prefetch>Leads</Link>
            <Link className="px-2 py-1 rounded hover:bg-white/10" href="/followups" prefetch>Follow-ups</Link>
            <details>
              <summary className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer inline-flex items-center gap-1">
                <SettingsIcon size={16} aria-hidden="true" /> Settings
              </summary>
              <div className="pl-2 mt-1 flex flex-col">
                <Link className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10" href="/settings/teams" prefetch><Users size={14} /> Teams</Link>
                <Link className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10" href="/settings/templates" prefetch><FileText size={14} /> Templates</Link>
                <Link className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10" href="/import" prefetch><Upload size={14} /> Import</Link>
                <Link className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10" href="/settings/assignment-rules" prefetch><ListChecks size={14} /> Assignment Rules</Link>
                <div className="border-t border-white/10 my-1" />
                <Link className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 text-danger" href="/logout" prefetch><LogOut size={14} /> Logout</Link>
              </div>
            </details>
          </nav>
        </div>
      </details>
    </nav>
  )
}

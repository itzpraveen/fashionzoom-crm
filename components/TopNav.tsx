"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, CalendarClock, FileText, Upload, ListChecks, LogOut, Settings as SettingsIcon, Menu as MenuIcon } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import AuthNav from '@/components/AuthNav'

const mainItems: { href: string; label: string }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/followups', label: 'Follow-ups' },
]

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/auth/')
  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then((res: any) => setLoggedIn(!!res?.data?.user))
    const { data } = supabase.auth.onAuthStateChange((_evt: any, session: any) => setLoggedIn(!!session?.user))
    return () => { data.subscription.unsubscribe() }
  }, [])
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
      {loggedIn && !isAuthRoute && (
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
                prefetch={false}
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
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/teams" prefetch={false} role="menuitem">
                  <Users size={16} aria-hidden="true" /> <span>Teams</span>
                </Link>
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/templates" prefetch={false} role="menuitem">
                  <FileText size={16} aria-hidden="true" /> <span>Templates</span>
                </Link>
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/import" prefetch={false} role="menuitem">
                  <Upload size={16} aria-hidden="true" /> <span>Import</span>
                </Link>
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/assignment-rules" prefetch={false} role="menuitem">
                  <ListChecks size={16} aria-hidden="true" /> <span>Assignment Rules</span>
                </Link>
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/events" prefetch={false} role="menuitem">
                  <CalendarClock size={16} aria-hidden="true" /> <span>Events & Programs</span>
                </Link>
                <div className="my-1 border-t border-white/10" />
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-danger/20 text-danger" href="/logout" prefetch role="menuitem">
                  <LogOut size={16} aria-hidden="true" /> <span>Logout</span>
                </Link>
              </nav>
            </div>
          </details>
        </div>
      )}
      {/* Mobile actions + menu */}
      <div className="ml-auto sm:hidden flex items-center gap-2">
        <ThemeToggle />
        {loggedIn && !isAuthRoute && (
        <details className="relative">
          <summary className="list-none cursor-pointer rounded bg-white/10 px-3 py-2 inline-flex items-center gap-2">
            <MenuIcon size={16} aria-hidden="true" /> Menu
          </summary>
          <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-surface shadow-xl shadow-black/30 p-2 z-50">
            <nav className="flex flex-col text-base" aria-label="Mobile navigation">
              {loggedIn && (
                <>
                  <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/dashboard" prefetch={false}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/leads" prefetch={false}>
                    <Users size={16} /> Leads
                  </Link>
                  <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/followups" prefetch={false}>
                    <CalendarClock size={16} /> Follow-ups
                  </Link>
                  <details>
                    <summary className="px-3 py-2 rounded hover:bg-white/10 cursor-pointer inline-flex items-center gap-2">
                      <SettingsIcon size={16} /> Settings
                    </summary>
                    <div className="pl-3 mt-1 flex flex-col">
                      <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/teams" prefetch={false}><Users size={14} /> Teams</Link>
                      <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/templates" prefetch={false}><FileText size={14} /> Templates</Link>
                      <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/import" prefetch={false}><Upload size={14} /> Import</Link>
                      <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/assignment-rules" prefetch={false}><ListChecks size={14} /> Assignment Rules</Link>
                      <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/events" prefetch={false}><CalendarClock size={14} /> Events & Programs</Link>
                    </div>
                  </details>
                  <div className="border-t border-white/10 my-1" />
                </>
              )}
              {/* Login/Logout entry */}
              <AuthNav />
            </nav>
          </div>
        </details>
        )}
      </div>
    </nav>
  )
}

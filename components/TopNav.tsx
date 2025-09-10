"use client"
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutDashboard, Users, CalendarClock, FileText, Upload, ListChecks, LogOut, Settings as SettingsIcon, Menu as MenuIcon, Search as SearchIcon, UserPlus } from 'lucide-react'
import { normalizeRole } from '@/lib/utils/role'
import { ThemeToggle } from '@/components/ThemeToggle'
import NotificationsBell from '@/components/NotificationsBell'
import AuthNav from '@/components/AuthNav'
import { useUser } from '@/lib/auth/user-context'

const mainItems: { href: string; label: string }[] = [
  { href: '/dashboard/overview', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/followups', label: 'Follow-ups' },
]

export default function TopNav() {
  const pathname = usePathname()
  const { user, profile } = useUser()
  const loggedIn = !!user
  const role = useMemo(() => profile?.role ? normalizeRole(profile.role) : null, [profile])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const settingsRef = useRef<HTMLDetailsElement | null>(null)
  const mobileRef = useRef<HTMLDetailsElement | null>(null)
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/auth/')
  // Close menus on route change
  useEffect(() => { setSettingsOpen(false); setMobileOpen(false) }, [pathname])
  // Click-away + Esc to close menus
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (settingsRef.current && !settingsRef.current.contains(t)) setSettingsOpen(false)
      if (mobileRef.current && !mobileRef.current.contains(t)) setMobileOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSettingsOpen(false); setMobileOpen(false) } }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onEsc) }
  }, [])
  // Search moved to Command Palette (Ctrl/Cmd+K)
  return (
    <nav aria-label="Top" className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3 text-sm">
      <Link href="/dashboard/overview" className="font-semibold tracking-tight flex items-center gap-2" aria-label="Go to dashboard">
        <span className="inline-flex items-center h-6">
          <Image src="/brand/logo-light.png" alt="FashionZoom CRM" width={120} height={24} className="h-6 w-auto dark:hidden" priority={false} />
          <Image src="/brand/logo-dark.png" alt="FashionZoom CRM" width={120} height={24} className="h-6 w-auto hidden dark:inline" priority={false} />
        </span>
      </Link>
      {/* Desktop nav */}
      {loggedIn && !isAuthRoute && (
        <div className="ml-auto hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={()=>window.dispatchEvent(new Event('open-cmdk'))}
            className="hidden md:inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2 text-sm"
            title="Search (Ctrl/Cmd+K)"
          >
            <SearchIcon size={16} aria-hidden="true" />
            <span>Search</span>
            <span className="ml-1 hidden items-center gap-0.5 rounded border border-white/10 px-1 text-[10px] text-muted md:inline-flex">{navigator?.platform?.includes('Mac') ? '⌘ K' : 'Ctrl K'}</span>
          </button>
          <NotificationsBell />
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
          <details ref={settingsRef} className="relative" open={settingsOpen} onToggle={(e)=>setSettingsOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary className="list-none cursor-pointer hover:underline inline-flex items-center gap-1">
              <SettingsIcon size={16} aria-hidden="true" /> Settings
            </summary>
            <div className="absolute right-0 mt-2 min-w-56 rounded-lg border border-white/10 bg-surface shadow-xl shadow-black/30 p-1 z-50">
              <nav className="flex flex-col text-sm" aria-label="Settings" role="menu">
                {role === 'ADMIN' && (
                  <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/teams" prefetch={false} role="menuitem">
                    <Users size={16} aria-hidden="true" /> <span>Teams</span>
                  </Link>
                )}
                {(role === 'ADMIN' || role === 'MANAGER') && (
                  <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/settings/teams#invite" prefetch={false} role="menuitem">
                    <UserPlus size={16} aria-hidden="true" /> <span>Invite</span>
                  </Link>
                )}
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
                <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-danger/20 text-danger" href="/logout" prefetch={false} role="menuitem">
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
        <details ref={mobileRef} className="relative" open={mobileOpen} onToggle={(e)=>setMobileOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary className="list-none cursor-pointer rounded bg-white/10 px-3 py-2 inline-flex items-center gap-2">
            <MenuIcon size={16} aria-hidden="true" /> Menu
          </summary>
          <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-surface shadow-xl shadow-black/30 p-2 z-50">
            <nav className="flex flex-col text-base" aria-label="Mobile navigation">
              {loggedIn && (
                <>
                  <Link className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10" href="/dashboard/overview" prefetch={false}>
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
                      {role === 'ADMIN' && (
                        <>
                          <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/teams" prefetch={false}><Users size={14} /> Teams</Link>
                          <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/teams#invite" prefetch={false}><UserPlus size={14} /> Invite</Link>
                        </>
                      )}
                      {role === 'MANAGER' && (
                        <Link className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10" href="/settings/teams#invite" prefetch={false}><UserPlus size={14} /> Invite</Link>
                      )}
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

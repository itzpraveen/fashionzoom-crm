"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, CalendarClock, Upload, Settings } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', Icon: Users },
  { href: '/followups', label: 'Follow-ups', Icon: CalendarClock },
  { href: '/import', label: 'Import', Icon: Upload },
  { href: '/settings/templates', label: 'Settings', Icon: Settings },
]

export default function FooterNav() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then((res: any) => setLoggedIn(!!res?.data?.user))
    const { data } = supabase.auth.onAuthStateChange((_evt: any, session: any) => setLoggedIn(!!session?.user))
    return () => { data.subscription.unsubscribe() }
  }, [])

  // Hide on auth pages or when not signed in
  if (!loggedIn) return null
  if (pathname?.startsWith('/login') || pathname?.startsWith('/auth/')) return null

  return (
    <nav aria-label="Primary" className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-white/10">
      <ul className="grid grid-cols-5 gap-1 px-2 py-1 pb-[calc(env(safe-area-inset-bottom)+0.4rem)]">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 rounded touch-target ${active ? 'text-primary' : 'text-fg/80 hover:text-fg'} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70`}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary/80" />}
                <Icon size={22} aria-hidden="true" />
                <span className="text-[12px] leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

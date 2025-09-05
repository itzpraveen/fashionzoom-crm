"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  return (
    <nav aria-label="Primary" className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-black/80 backdrop-blur border-t border-white/10">
      <ul className="grid grid-cols-5 gap-1 px-2 py-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded touch-target ${active ? 'text-primary' : 'text-muted hover:text-fg'} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70`}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="text-[11px] leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

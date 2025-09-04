import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import SWRegister from './sw-register'
import FooterNav from '@/components/FooterNav'

export const metadata = {
  title: 'FashionZoom CRM',
  description: 'Lead capture, calling & WhatsApp follow-ups',
  manifest: '/manifest.json',
  themeColor: '#0b0b0c'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 backdrop-blur bg-bg/80 border-b border-white/10">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-sm">
            <Link href="/leads" className="font-semibold tracking-tight">FashionZoom CRM</Link>
            <div className="ml-auto hidden sm:flex items-center gap-3">
              <Link className="hover:underline" href="/dashboard">Dashboard</Link>
              <Link className="hover:underline" href="/leads">Leads</Link>
              <Link className="hover:underline" href="/followups">Follow-ups</Link>
              <Link className="hover:underline" href="/import">Import</Link>
              <Link className="hover:underline" href="/settings/templates">Settings</Link>
              <Link className="hover:underline" href="/login">Login</Link>
            </div>
            <div className="ml-auto sm:hidden">
              <Link className="rounded bg-white/10 px-2 py-1" href="/login">Login</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-4 pb-20 sm:pb-6">
          {children}
        </main>
        {/* Register service worker across the app */}
        <SWRegister />
        {/* Bottom navigation for mobile */}
        <FooterNav />
      </body>
    </html>
  )
}

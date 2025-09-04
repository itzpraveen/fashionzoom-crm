import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'FashionZoom CRM',
  description: 'Lead capture, calling & WhatsApp follow-ups',
  manifest: '/manifest.json'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 backdrop-blur bg-bg/80 border-b border-white/10">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-sm">
            <Link href="/leads" className="font-semibold">FashionZoom CRM</Link>
            <div className="ml-auto flex items-center gap-3">
              <Link className="hover:underline" href="/dashboard">Dashboard</Link>
              <Link className="hover:underline" href="/leads">Leads</Link>
              <Link className="hover:underline" href="/followups">Follow-ups</Link>
              <Link className="hover:underline" href="/import">Import</Link>
              <Link className="hover:underline" href="/settings/templates">Settings</Link>
              <Link className="hover:underline" href="/login">Login</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-4">
          {children}
        </main>
      </body>
    </html>
  )
}


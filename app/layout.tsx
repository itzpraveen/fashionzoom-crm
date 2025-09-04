import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import SWRegister from './sw-register'
import FooterNav from '@/components/FooterNav'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'FashionZoom CRM',
  description: 'Lead capture, calling & WhatsApp follow-ups',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    shortcut: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0c' }
  ],
  colorScheme: 'light dark'
}

const themeInitScript = `(() => { try { const t = localStorage.getItem('fzcrm-theme'); if (t==='light'||t==='dark') document.documentElement.setAttribute('data-theme', t); } catch (e) {} })();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-grid">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-b from-black/10 to-transparent backdrop-blur">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-sm">
            <Link href="/leads" className="font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary font-bold">FZ</span>
              FashionZoom CRM
            </Link>
            <div className="ml-auto hidden sm:flex items-center gap-3">
              <Link className="hover:underline" href="/dashboard">Dashboard</Link>
              <Link className="hover:underline" href="/leads">Leads</Link>
              <Link className="hover:underline" href="/followups">Follow-ups</Link>
              <Link className="hover:underline" href="/import">Import</Link>
              <Link className="hover:underline" href="/settings/templates">Settings</Link>
              <Link className="hover:underline" href="/login">Login</Link>
              <ThemeToggle />
            </div>
            <div className="ml-auto sm:hidden">
              <Link className="rounded bg-white/10 px-2 py-1 mr-2" href="/login">Login</Link>
              <ThemeToggle />
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

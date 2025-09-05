import './globals.css'
import type { ReactNode } from 'react'
// PWA handling is feature-flagged for dev convenience
import SWUnregister from './sw-unregister'
import SWRegister from './sw-register'
import FooterNav from '@/components/FooterNav'
import TopNav from '@/components/TopNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import AuthNav from '@/components/AuthNav'
// Keep layout static for fast navigations; do not fetch auth here

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const enablePWA = process.env.NEXT_PUBLIC_ENABLE_PWA === '1'
  return (
    <html lang="en">
      <body className="bg-grid">
        {/* Skip link for keyboard users */}
        <a href="#content" className="visually-hidden focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-3 focus:py-2 focus:rounded">Skip to content</a>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-b from-black/10 to-transparent backdrop-blur">
          <TopNav />
          <div className="mx-auto max-w-6xl px-4 pb-2 flex items-center justify-end sm:hidden gap-3">
            <AuthNav />
            <ThemeToggle />
          </div>
        </header>
        <main id="content" role="main" className="mx-auto max-w-6xl px-4 py-4 pb-20 sm:pb-6">
          {children}
        </main>
        {/* Register SW if enabled; otherwise actively unregister */}
        {enablePWA ? <SWRegister /> : <SWUnregister />}
        {/* Bottom navigation for mobile */}
        <FooterNav />
      </body>
    </html>
  )
}

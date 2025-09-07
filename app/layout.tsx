import './globals.css'
import type { ReactNode } from 'react'
// PWA handling is feature-flagged for dev convenience
import SWUnregister from './sw-unregister'
import SWRegister from './sw-register'
import FooterNav from '@/components/FooterNav'
import TopNav from '@/components/TopNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import AuthNav from '@/components/AuthNav'
import MobileFab from '@/components/MobileFab'
import CommandPalette from '@/components/CommandPalette'
// Keep layout static for fast navigations; do not fetch auth here

export const metadata = {
  title: 'FashionZoom CRM',
  description: 'Lead capture, calling & WhatsApp follow-ups',
  manifest: '/manifest.json',
  icons: {
    icon: '/brand/logo-light.png',
    shortcut: '/brand/logo-light.png',
    apple: '/brand/logo-light.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0c' }
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

const themeInitScript = `(() => { try { const t = localStorage.getItem('fzcrm-theme'); const root = document.documentElement; if (t==='light'||t==='dark') { root.setAttribute('data-theme', t); } else { root.setAttribute('data-theme', 'light'); } } catch (e) { document.documentElement.setAttribute('data-theme','light'); } })();`

export default async function RootLayout({ children }: { children: ReactNode }) {
  const enablePWA = process.env.NEXT_PUBLIC_ENABLE_PWA === '1'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return (
    <html lang="en">
      <body className="overflow-x-hidden md:bg-grid">
        {/* Skip link for keyboard users */}
        <a href="#content" className="visually-hidden focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-3 focus:py-2 focus:rounded">Skip to content</a>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Hint the browser to establish early connection to Supabase */}
        {supabaseUrl ? (
          <>
            <link rel="dns-prefetch" href={supabaseUrl} />
            <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />
          </>
        ) : null}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-b from-black/5 to-transparent md:backdrop-blur pt-[env(safe-area-inset-top)]">
          <TopNav />
        </header>
        <main id="content" role="main" className="mx-auto max-w-6xl px-4 py-4 pb-20 sm:pb-6">
          {children}
        </main>
        <CommandPalette />
        {/* Register SW if enabled; otherwise actively unregister */}
        {enablePWA ? <SWRegister /> : <SWUnregister />}
        {/* Bottom navigation for mobile */}
        <FooterNav />
        {/* Center floating action for quick add on mobile */}
        <MobileFab />
      </body>
    </html>
  )
}

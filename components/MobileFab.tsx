"use client"
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AddLeadModal } from './AddLeadModal'
import { createBrowserClient } from '@/lib/supabase/client'

export default function MobileFab() {
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then((res: any) => setLoggedIn(!!res?.data?.user))
    const { data } = supabase.auth.onAuthStateChange((_evt: any, session: any) => {
      setLoggedIn(!!session?.user)
    })
    return () => { data.subscription.unsubscribe() }
  }, [])

  // Hide FAB on auth pages or when not signed in
  if (!loggedIn) return null
  if (pathname?.startsWith('/login') || pathname?.startsWith('/auth/')) return null

  return (
    <>
      <button
        aria-label="Add lead"
        onClick={() => setOpen(true)}
        className="sm:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-50 h-12 w-12 rounded-full bg-primary text-white shadow-lg shadow-black/40 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
      >
        <Plus size={22} aria-hidden="true" />
      </button>
      <AddLeadModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

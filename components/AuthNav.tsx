"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function AuthNav() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then((res: any) => setLoggedIn(!!res?.data?.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, session: any) => {
      setLoggedIn(!!session?.user)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  // If unknown, render both links to avoid layout shift
  if (loggedIn === null) {
    return (
      <>
        <Link prefetch className="hover:underline" href="/login">Login</Link>
      </>
    )
  }

  return loggedIn ? (
    <Link prefetch={false} className="hover:underline" href="/logout">Logout</Link>
  ) : (
    <Link prefetch className="hover:underline" href="/login">Login</Link>
  )
}

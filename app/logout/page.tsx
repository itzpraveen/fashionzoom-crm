"use client"
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      const redirect = params.get('redirect') || '/login'
      router.replace(redirect)
    }
    run()
  }, [router, params])
  return null
}


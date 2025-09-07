import { NextResponse } from 'next/server'
import { createDemoSupabase } from '@/lib/supabase/demo'
import { createClient } from '@supabase/supabase-js'

function getPublicClient() {
  if (process.env.NEXT_PUBLIC_DEMO === '1') return createDemoSupabase() as any
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ) as any
}

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

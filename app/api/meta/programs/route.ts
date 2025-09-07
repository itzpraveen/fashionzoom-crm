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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    if (!eventId) return NextResponse.json([], { status: 200 })
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


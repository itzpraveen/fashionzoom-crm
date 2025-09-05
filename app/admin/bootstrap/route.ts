import { NextResponse } from 'next/server'

// One-time bootstrap endpoint to promote a user to ADMIN by email.
// Protect with SUPERADMIN_BOOTSTRAP_TOKEN. Remove the token after use.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email) return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 })
  if (!token || token !== process.env.SUPERADMIN_BOOTSTRAP_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Server not configured with service key' }, { status: 500 })
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  // Find or create auth user
  let userId: string | null = null
  const lookup = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers })
  if (lookup.ok) {
    const json: any = await lookup.json().catch(() => null)
    userId = json?.users?.[0]?.id ?? null
  }
  if (!userId) {
    const created = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, email_confirm: false }),
    })
    if (!created.ok) {
      const text = await created.text().catch(() => '')
      return NextResponse.json({ ok: false, error: text || 'Failed to create auth user' }, { status: 500 })
    }
    const obj: any = await created.json().catch(() => null)
    userId = obj?.id ?? null
  }

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'User resolution failed' }, { status: 500 })
  }

  // Promote to ADMIN via profiles upsert
  const prof = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: userId, role: 'ADMIN' }),
  })
  if (!prof.ok) {
    const text = await prof.text().catch(() => '')
    return NextResponse.json({ ok: false, error: text || 'Failed to upsert profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId })
}


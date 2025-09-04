// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const body = await req.json().catch(() => ({})) as any
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      full_name: body.name || body.full_name || null,
      primary_phone: body.phone || body.primary_phone,
      city: body.city || null,
      source: body.source || 'Other'
    })
  })
  if (!resp.ok) return new Response(await resp.text(), { status: resp.status })
  const data = await resp.json()
  return new Response(JSON.stringify({ ok: true, data }), { headers: { 'Content-Type': 'application/json' } })
})


import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTemplate, deleteTemplate } from '@/actions/templates'

export default async function TemplatesPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canEdit = (me?.role === 'MANAGER' || me?.role === 'ADMIN')
  const { data: templates } = await supabase.from('templates').select('*').order('created_at', { ascending: false }).limit(50)
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Message Templates</h1>
      <p className="text-sm text-muted">Reusable templates for WhatsApp, SMS, or Email. Variables like <code>{'{'}{'}'}name{'}'}{'}'}</code> are replaced with lead data when composing messages.</p>

      {canEdit && (
        <section className="border border-white/10 rounded p-3 space-y-2">
          <h2 className="font-medium">Create Template</h2>
          <form action={createTemplate} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <div className="sm:col-span-1">
              <label className="block text-xs text-muted">Channel</label>
              <select name="channel" className="w-full rounded bg-surface-2 border border-line px-3 py-2">
                {[
                  { value: 'WHATSAPP', label: 'WhatsApp' },
                  { value: 'SMS', label: 'SMS' },
                  { value: 'EMAIL', label: 'Email' }
                ].map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted">Name</label>
              <input name="name" placeholder="First touch" className="w-full rounded bg-surface-2 border border-line px-3 py-2" required />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs text-muted">Body</label>
              <textarea name="body" placeholder="Hello {{name}}, …" className="w-full rounded bg-surface-2 border border-line px-3 py-2" rows={2} required />
            </div>
            <div className="sm:col-span-6">
              <button className="rounded bg-primary text-white px-3 py-2">Add Template</button>
            </div>
          </form>
        </section>
      )}
      <div className="grid gap-2">
        {templates?.map((t: any) => (
          <div key={t.id} className="border border-white/10 rounded p-3">
            <div className="text-sm text-muted">{t.channel}</div>
            <div className="font-medium">{t.name}</div>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{t.body}</pre>
            {canEdit && (
              <form action={deleteTemplate} className="mt-2">
                <input type="hidden" name="id" value={t.id} />
                <button className="px-2 py-1 rounded bg-white/10 text-xs">Delete</button>
              </form>
            )}
          </div>
        ))}
        {!templates?.length && (
          <p className="text-sm text-muted">No templates yet. {canEdit ? 'Create your first template above.' : 'Ask your manager to set up templates.'}</p>
        )}
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'

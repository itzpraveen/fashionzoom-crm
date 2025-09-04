import { createServerSupabase } from '@/lib/supabase/server'

export default async function TemplatesPage() {
  const supabase = createServerSupabase()
  const { data: templates } = await supabase.from('templates').select('*').order('created_at', { ascending: false }).limit(50)
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Templates</h1>
      <div className="grid gap-2">
        {templates?.map(t => (
          <div key={t.id} className="border border-white/10 rounded p-3">
            <div className="text-sm text-muted">{t.channel}</div>
            <div className="font-medium">{t.name}</div>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{t.body}</pre>
          </div>
        ))}
        {!templates?.length && <p className="text-sm text-muted">No templates yet.</p>}
      </div>
    </div>
  )
}


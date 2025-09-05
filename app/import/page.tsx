import { ImportWizard } from '@/components/ImportWizard'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ImportPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import Leads</h1>
      <ImportWizard />
    </div>
  )
}
export const dynamic = 'force-dynamic'

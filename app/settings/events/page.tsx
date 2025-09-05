import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createEvent, updateEvent, deleteEvent, createProgram, updateProgram, deleteProgram } from '@/actions/events'
import SubmitButton from '@/components/SubmitButton'
import ConfirmSubmit from '@/components/ConfirmSubmit'

export const dynamic = 'force-dynamic'

export default async function EventsSettingsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!me) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Events & Programs</h1>
        <p className="text-sm text-muted">Your profile isn’t initialized yet. Please sign out and sign back in.</p>
        <a href="/logout" className="btn-primary inline-block px-3 py-2 rounded">Logout</a>
      </div>
    )
  }
  const role = (me?.role ?? 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'
  if (role !== 'MANAGER' && role !== 'ADMIN') return <div className="text-sm">403 — Managers/Admins only.</div>

  const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false })
  const eventIds = (events || []).map((e: any) => e.id)
  const { data: programs } = eventIds.length
    ? await supabase.from('programs').select('*').in('event_id', eventIds).order('created_at', { ascending: true })
    : { data: [] as any[] }

  const programsByEvent: Record<string, any[]> = {}
  ;(programs || []).forEach((p: any) => {
    programsByEvent[p.event_id] = programsByEvent[p.event_id] || []
    programsByEvent[p.event_id].push(p)
  })

  async function createEventAction(formData: FormData) {
    'use server'
    await createEvent(formData)
  }
  async function updateEventAction(formData: FormData) {
    'use server'
    await updateEvent(formData)
  }
  async function deleteEventAction(formData: FormData) {
    'use server'
    await deleteEvent(formData)
  }
  async function createProgramAction(formData: FormData) {
    'use server'
    await createProgram(formData)
  }
  async function updateProgramAction(formData: FormData) {
    'use server'
    await updateProgram(formData)
  }
  async function deleteProgramAction(formData: FormData) {
    'use server'
    await deleteProgram(formData)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Events & Programs</h1>

      <section className="space-y-2">
        <h2 className="font-medium">Create Event</h2>
        <form action={createEventAction} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted">Name</label>
            <input name="name" className="form-input" placeholder="Fashion Week" required />
          </div>
          <div>
            <label className="block text-xs text-muted">Season</label>
            <input name="season" className="form-input" placeholder="SS25" />
          </div>
          <div>
            <label className="block text-xs text-muted">Starts at</label>
            <input name="starts_at" type="datetime-local" className="form-input" />
          </div>
          <div>
            <label className="block text-xs text-muted">Ends at</label>
            <input name="ends_at" type="datetime-local" className="form-input" />
          </div>
          <SubmitButton className="btn-primary" pendingLabel="Creating…">Create</SubmitButton>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Manage</h2>
        <div className="space-y-3">
          {(events || []).map((e: any) => (
            <div key={e.id} className="border border-line rounded p-3 space-y-2">
              <form action={updateEventAction} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                <input type="hidden" name="id" value={e.id} />
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted">Name</label>
                  <input name="name" defaultValue={e.name} className="form-input" required />
                </div>
                <div>
                  <label className="block text-xs text-muted">Season</label>
                  <input name="season" defaultValue={e.season || ''} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs text-muted">Starts at</label>
                  <input name="starts_at" type="datetime-local" defaultValue={e.starts_at ? new Date(e.starts_at).toISOString().slice(0,16) : ''} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs text-muted">Ends at</label>
                  <input name="ends_at" type="datetime-local" defaultValue={e.ends_at ? new Date(e.ends_at).toISOString().slice(0,16) : ''} className="form-input" />
                </div>
                <SubmitButton pendingLabel="Saving…" className="px-2 py-1 rounded bg-white/10 text-xs">Save</SubmitButton>
              </form>

              <div className="flex items-center gap-2">
                <form action={deleteEventAction} id={`delete-event-${e.id}`}>
                  <input type="hidden" name="id" value={e.id} />
                </form>
                <ConfirmSubmit formId={`delete-event-${e.id}`} className="px-2 py-1 rounded bg-danger/80 text-white text-xs" confirmMessage="Delete event? Programs and enrollments will also be removed.">Delete Event</ConfirmSubmit>
              </div>

              <div className="mt-2 space-y-2">
                <div className="text-sm font-medium">Programs</div>
                <form action={createProgramAction} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <input type="hidden" name="event_id" value={e.id} />
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted">Name</label>
                    <input name="name" className="form-input" placeholder="Designer Runway" required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted">Category</label>
                    <input name="category" className="form-input" placeholder="Showcase/Sponsor/Buyer…" />
                  </div>
                  <SubmitButton pendingLabel="Adding…" className="px-2 py-1 rounded bg-white/10 text-xs">Add</SubmitButton>
                </form>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-muted">
                      <tr>
                        <th className="py-2 pr-4">Program</th>
                        <th className="py-2 pr-4">Category</th>
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(programsByEvent[e.id] || []).map((p: any) => (
                        <tr key={p.id} className="border-t border-white/10">
                          <td className="py-2 pr-4">
                            <form action={updateProgramAction} className="flex items-center gap-2">
                              <input type="hidden" name="id" value={p.id} />
                              <input name="name" defaultValue={p.name} className="form-input w-56" />
                              <input name="category" defaultValue={p.category || ''} className="form-input w-40" />
                              <SubmitButton pendingLabel="Saving…" className="px-2 py-1 rounded bg-white/10 text-xs">Save</SubmitButton>
                            </form>
                          </td>
                          <td className="py-2 pr-4">{p.category || '—'}</td>
                          <td className="py-2 pr-4">
                            <form action={deleteProgramAction} id={`delete-program-${p.id}`}>
                              <input type="hidden" name="id" value={p.id} />
                            </form>
                            <ConfirmSubmit formId={`delete-program-${p.id}`} className="px-2 py-1 rounded bg-white/10 text-xs" confirmMessage="Delete program?">Delete</ConfirmSubmit>
                          </td>
                        </tr>
                      ))}
                      {!programsByEvent[e.id]?.length && (
                        <tr><td className="py-2 text-muted" colSpan={3}>No programs yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
          {!events?.length && (
            <p className="text-sm text-muted">No events yet. Create your first event above.</p>
          )}
        </div>
      </section>
    </div>
  )
}


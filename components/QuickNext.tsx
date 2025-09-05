"use client"
import { useRouter } from 'next/navigation'
import { createFollowup } from '@/actions/leads'

export default function QuickNext({ leadId }: { leadId: string }) {
  const router = useRouter()
  const set = (days: number) => async () => {
    const due = new Date(); due.setDate(due.getDate() + days)
    await createFollowup({ leadId, dueAt: due.toISOString(), priority: 'MEDIUM' })
    router.refresh()
  }
  return (
    <div className="flex items-center gap-1">
      <button onClick={set(1)} className="px-1.5 py-0.5 rounded bg-white/10 text-xs">+1d</button>
      <button onClick={set(3)} className="px-1.5 py-0.5 rounded bg-white/10 text-xs">+3d</button>
      <button onClick={set(7)} className="px-1.5 py-0.5 rounded bg-white/10 text-xs">+7d</button>
    </div>
  )
}


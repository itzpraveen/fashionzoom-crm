"use client"
import { useRouter } from 'next/navigation'
import { saveDisposition } from '@/actions/leads'

export default function MarkContactedButton({ leadId }: { leadId: string }) {
  const router = useRouter()
  const onClick = async () => {
    await saveDisposition({ leadId, outcome: 'CONNECTED', nextFollowUpAt: null, priority: 'MEDIUM' })
    router.refresh()
  }
  return (
    <button onClick={onClick} className="px-2 py-1 rounded bg-white/10 text-xs">Mark contacted</button>
  )
}


"use client"
import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children, pendingLabel, className }: { children: React.ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className || 'btn-primary'}>
      {pending ? (pendingLabel || 'Saving…') : children}
    </button>
  )
}


import Link from 'next/link'

export function EmptyState({ title, hint, actionHref, actionLabel }: { title: string; hint?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="text-center p-8 border border-white/10 rounded">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {hint && <p className="text-sm text-muted mb-3">{hint}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-flex items-center rounded bg-primary text-black px-3 py-2 font-medium">{actionLabel}</Link>
      )}
    </div>
  )
}


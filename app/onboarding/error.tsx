"use client"
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="max-w-lg mx-auto mt-8 p-4 rounded border border-white/10 bg-white/5">
      <h2 className="text-lg font-semibold mb-2">Couldn’t complete sign-in</h2>
      <p className="text-sm text-muted mb-3">Your magic link may be invalid or expired. Please request a new link.</p>
      <div className="flex gap-2">
        <Link href="/login" className="rounded bg-primary text-white px-3 py-2 text-sm">Back to login</Link>
        <button onClick={reset} className="rounded bg-white/10 px-3 py-2 text-sm">Try again</button>
      </div>
      {error?.digest && <p className="mt-3 text-xs text-muted">Error ID: <code>{error.digest}</code></p>}
    </div>
  )
}


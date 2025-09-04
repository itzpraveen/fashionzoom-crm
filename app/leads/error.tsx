"use client"
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="max-w-lg mx-auto mt-8 p-4 rounded border border-white/10 bg-white/5">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted mb-4">We couldn’t load your leads. If you recently changed permissions, try reloading. If the issue persists, contact an admin.</p>
      {error?.digest && (
        <p className="text-xs text-muted mb-3">Error ID: <code>{error.digest}</code></p>
      )}
      <div className="flex gap-2">
        <button onClick={reset} className="rounded bg-primary text-white px-3 py-2 text-sm">Reload</button>
        <Link href="/login" className="rounded bg-white/10 px-3 py-2 text-sm">Login</Link>
      </div>
    </div>
  )
}

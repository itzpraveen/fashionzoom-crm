"use client"
export default function Error({ reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-muted mb-3">Please try again, or reload the page.</p>
      <button className="rounded bg-primary text-white px-3 py-2 text-sm" onClick={reset}>Try again</button>
    </div>
  )
}


"use client"
export default function GlobalError({ reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold mb-2">App error</h1>
        <p className="text-sm text-muted mb-3">Something went wrong. Try again.</p>
        <button className="rounded bg-primary text-white px-3 py-2 text-sm" onClick={reset}>Reload</button>
      </body>
    </html>
  )
}


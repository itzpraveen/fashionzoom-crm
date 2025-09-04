"use client"
import { useEffect, useState } from 'react'

export function Toast({ message, action, onUndo }: { message: string; action?: string; onUndo?: () => void }) {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4000)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded shadow">
      <span className="mr-3">{message}</span>
      {action && onUndo && <button onClick={onUndo} className="underline">{action}</button>}
    </div>
  )
}


"use client"
import { useState, useEffect } from 'react'
import { AddLeadModal } from './AddLeadModal'

export function AddLeadButton() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onHash = () => setOpen(location.hash === '#add-lead')
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return (
    <>
      <button onClick={() => { setOpen(true); history.replaceState(null, '', '#add-lead') }} className="rounded bg-primary text-black px-3 py-2 text-sm">Add Lead</button>
      <AddLeadModal open={open} onClose={() => { setOpen(false); history.replaceState(null, '', '#') }} />
    </>
  )
}


"use client"
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddLeadModal } from './AddLeadModal'

export default function MobileFab() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        aria-label="Add lead"
        onClick={() => setOpen(true)}
        className="sm:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-50 h-12 w-12 rounded-full bg-primary text-white shadow-lg shadow-black/40 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
      >
        <Plus size={22} aria-hidden="true" />
      </button>
      <AddLeadModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}


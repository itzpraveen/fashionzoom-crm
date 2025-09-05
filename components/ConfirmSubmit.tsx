"use client"
import React from 'react'

type Props = {
  formId: string
  children: React.ReactNode
  className?: string
  confirmMessage?: string
}

export default function ConfirmSubmit({ formId, children, className, confirmMessage }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return
        const form = document.getElementById(formId) as HTMLFormElement | null
        if (form) form.requestSubmit()
      }}
    >
      {children}
    </button>
  )
}


import React from 'react'

type Props = {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string | null
  children: React.ReactNode
  className?: string
}

export default function Field({ label, htmlFor, required, hint, error, children, className }: Props) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label} {required ? <span className="text-danger" aria-hidden>*</span> : null}
      </label>
      <div className="mt-1">
        {children}
      </div>
      {hint && !error ? <p className="text-xs text-muted mt-0.5">{hint}</p> : null}
      {error ? <p className="text-xs text-danger mt-0.5" role="alert">{error}</p> : null}
    </div>
  )
}


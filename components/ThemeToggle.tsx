"use client"
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem('fzcrm-theme') as Theme | null) || 'light'
    setTheme(stored)
    applyTheme(stored)
  }, [])

  function applyTheme(next: Theme) {
    const root = document.documentElement
    if (next === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', next)
    }
  }

  function onChange(next: Theme) {
    setTheme(next)
    localStorage.setItem('fzcrm-theme', next)
    applyTheme(next)
  }

  const title = theme === 'system' ? 'Theme: Auto' : `Theme: ${theme[0].toUpperCase()}${theme.slice(1)}`
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  function cycle() {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    onChange(next)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

"use client"
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = (localStorage.getItem('fzcrm-theme') as Theme | null) || 'system'
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

  return (
    <div className="relative">
      <label className="visually-hidden" htmlFor="theme">Theme</label>
      <select id="theme" className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
        value={theme}
        onChange={(e)=>onChange(e.target.value as Theme)}
        aria-label="Theme switcher">
        <option value="system">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  )
}


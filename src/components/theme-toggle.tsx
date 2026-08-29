'use client'

import { useState } from 'react'

export function ThemeToggle() {
  const [, setTick] = useState(0)

  const toggle = () => {
    const root = document.documentElement
    if (root.classList.contains('light')) {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    setTick(t => t + 1)
  }

  const isDark = typeof window !== 'undefined'
    ? !document.documentElement.classList.contains('light')
    : true

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-accent transition-colors"
      aria-label="Alternar tema"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
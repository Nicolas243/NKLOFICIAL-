'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return <button className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Alternar tema"><span className="w-5 h-5 block" /></button>
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-1 rounded-full hover:bg-accent transition-all duration-300"
      aria-label="Alternar tema"
    >
      <img
        src="/NKL/moonsun.png"
        alt="Alternar tema"
        width={28} height={28}
        className={`transition-transform duration-500 ${isDark ? 'rotate-0 brightness-100' : 'rotate-180 brightness-75 hue-rotate-180'}`}
      />
    </button>
  )
}
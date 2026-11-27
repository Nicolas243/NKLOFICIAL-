'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return (
      <button
        type="button"
        className="relative z-[99999] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/90"
        aria-label="Alternar tema"
        disabled
      >
        <span className="block h-[26px] w-[26px]" />
      </button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative z-[99999] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors duration-200 hover:bg-accent hover:border-neon"
      aria-label="Alternar tema"
      aria-pressed={isDark}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      <Image
        src="/NKL/moonsun-portal.png"
        alt=""
        width={26}
        height={26}
        className="portal-theme-icon"
        aria-hidden="true"
      />
    </button>
  )
}
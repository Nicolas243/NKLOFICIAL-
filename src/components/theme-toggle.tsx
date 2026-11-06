'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return <button className="relative z-[99999] flex h-11 w-11 shrink-0 items-center justify-center rounded-md outline-none focus:outline-none focus:ring-0" aria-label="Alternar tema"><span className="block h-[27px] w-[27px]" /></button>
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative z-[99999] flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-transparent outline-none transition-all duration-300 hover:bg-accent focus:outline-none focus:ring-0"
      aria-label="Alternar tema"
      style={{ backgroundColor: isDark ? '#000' : '#fff' }}
    >
      <Image
        src="/NKL/moonsun.png"
        alt="Alternar tema"
        width={27} height={27}
        className="w-[27px] h-[27px] object-contain transition-transform duration-500"
      />
    </button>
  )
}
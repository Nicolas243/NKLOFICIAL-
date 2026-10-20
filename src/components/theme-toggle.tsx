'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return <button className="relative z-[99999] w-[35px] h-[35px] shrink-0 flex items-center justify-center rounded-[3px]" aria-label="Alternar tema"><span className="w-[27px] h-[27px] block" /></button>
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative z-[99999] w-[35px] h-[35px] shrink-0 flex items-center justify-center rounded-[3px] transition-all duration-300"
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
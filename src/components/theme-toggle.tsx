'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[3px]" aria-label="Alternar tema"><span className="w-[22px] h-[22px] block" /></button>
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-[30px] h-[30px] flex items-center justify-center rounded-[3px] transition-all duration-300"
      aria-label="Alternar tema"
      style={{ backgroundColor: isDark ? '#000' : '#fff' }}
    >
      <Image
        src="/NKL/moonsun.png"
        alt="Alternar tema"
        width={22} height={22}
        className="w-[22px] h-[22px] object-contain transition-transform duration-500"
      />
    </button>
  )
}
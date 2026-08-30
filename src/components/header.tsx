'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/theme-toggle'

const groups = [
  { label: 'Cordas', items: [
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/comparar', label: 'Comparador' },
    { href: '/guia-de-cordas', label: 'Gráfico' },
  ]},
  { label: 'Luteria', items: [
    { href: '/clinica', label: 'Clínica de Luteria' },
    { href: '/fisica-do-som', label: 'Física do Som' },
  ]},
  { label: 'Notícias', items: [
    { href: '/noticias', label: 'Notícias' },
    { href: '/noticias#anunciar', label: 'Anunciar' },
  ]},
  { label: 'Encontre um...', items: [
    { href: '/luthiers', label: 'Luthier' },
    { href: '/luthiers#professor', label: 'Professor(a)' },
    { href: '/recomendados', label: 'Loja' },
  ]},
]

const LANG_OPTIONS = [
  { top: '/flags/br.svg', bottom: '/flags/pt.svg', label: 'PT' },
  { top: '/flags/mx.svg', bottom: '/flags/es.svg', label: 'ES' },
  { top: '/flags/us.svg', bottom: '/flags/gb.svg', label: 'EN' },
]

function FlagPair({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex w-8 h-5 rounded-[2px] overflow-hidden border border-border/50 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={top} className="w-1/2 object-cover object-left" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bottom} className="w-1/2 object-cover object-right" alt="" />
    </div>
  )
}

function LangDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        <FlagPair top="/flags/br.svg" bottom="/flags/pt.svg" />
      </button>
      {open && (
        <div className="fixed mt-2 z-[99999]">
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-2 flex flex-col gap-1"
            style={{ marginLeft: '-8px' }}>
            {LANG_OPTIONS.map((opt) => (
              <li key={opt.label}>
                <a href="#" className="block cursor-pointer hover:opacity-80"
                  onClick={(e) => { e.preventDefault(); setOpen(false) }}>
                  <FlagPair top={opt.top} bottom={opt.bottom} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Dropdown({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors flex items-center gap-1 active:scale-95">
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="fixed mt-2 z-[99999]"
          style={{ transform: 'translateX(-50%)', left: 'auto' }}>
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[200px]">
            {items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors whitespace-nowrap"
                  onClick={() => setOpen(false)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false
    supabase.auth.getUser().then(({ data }) => { if (!ignore) setIsLoggedIn(Boolean(data.user)) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { if (!ignore) setIsLoggedIn(Boolean(s?.user)) })
    return () => { ignore = true; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isHome) return null

  const authBtn = (
    <Link href={isLoggedIn ? '/perfil' : '/login'}
      className="px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90 active:scale-95">
      {isLoggedIn ? 'Perfil' : 'Entrar'}
    </Link>
  )

  const navLinks = (
    <>
      <Link href="/" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95" onClick={() => setMenuOpen(false)}>Home</Link>
      {groups.map((g) => <Dropdown key={g.label} label={g.label} items={g.items} />)}
      <Link href="/contatos" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95" onClick={() => setMenuOpen(false)}>Contatos</Link>
    </>
  )

  const rawBgColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff'
  const bgColor = mounted ? rawBgColor : undefined

  return (
    <header suppressHydrationWarning style={bgColor ? { backgroundColor: bgColor } : undefined} className={`lg:fixed top-0 w-full z-[100] border-b border-border transition-transform duration-300 ${scrolled && mounted ? 'lg:-translate-y-full' : 'lg:translate-y-0'}`}>
      {/* Row 1 */}
      <div className="max-w-[1200px] mx-auto px-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/NKL/NKL.png" alt="NKL" width={32} height={32} className="w-8 h-8 object-contain dark:invert" />
          <Link href="/" className="font-playfair font-bold text-lg tracking-tight">Portal</Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">{authBtn}</div>
          <LangDropdown />
          <ThemeToggle />
          <button className="lg:hidden p-2" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Row 2 — mesma altura da row1, empurra o corpo pra baixo */}
      {menuOpen && (
        <div suppressHydrationWarning style={bgColor ? { backgroundColor: bgColor } : undefined} className="lg:hidden border-t border-border h-[72px] flex items-center px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 w-full">
            {navLinks}
            <span className="sm:hidden shrink-0">{authBtn}</span>
          </div>
        </div>
      )}
    </header>
  )
}
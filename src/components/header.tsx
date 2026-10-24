'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useSessionUser } from '@/components/use-session-user'
import { useSyncExternalStore } from 'react'
import { useTheme } from '@/components/theme-provider'
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
    <div className="flex w-11 h-[30px] rounded-[2px] overflow-hidden border border-border/50 shrink-0">
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
        <FlagPair top="/flags/pt.svg" bottom="/flags/br.svg" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-[99999]">
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-2 flex flex-col gap-1">
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
  const alignRight = label === 'Notícias' || label === 'Encontre um...'
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center h-[30px] text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors gap-1 active:scale-95">
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className={`absolute top-full pt-2 z-[99999] ${alignRight ? 'right-0' : 'left-0'}`}>
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[200px] w-max max-w-[90vw]">
            {items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="inline-flex items-center h-[30px] text-[clamp(13.4px,1.8vw,16.8px)] font-medium leading-relaxed px-4 rounded-md hover:bg-accent hover:text-neon transition-colors whitespace-nowrap"
                  onClick={() => setOpen(false)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
function DropdownCompact({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const alignRight = label === 'Notícias' || label === 'Encontre um...'
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center h-[30px] text-[clamp(13.4px,1.8vw,16.8px)] max-[480px]:text-[11.2px] font-medium uppercase tracking-tight max-[480px]:tracking-[-0.03em] hover:text-neon transition-colors gap-1 max-[480px]:gap-0.5 active:scale-95 whitespace-nowrap">
        <span className={label === 'Encontre um...' ? 'max-[480px]:hidden' : ''}>{label}</span>
        {label === 'Encontre um...' && <span className="hidden max-[480px]:inline">Encontre</span>}
        <span className="text-xs max-[480px]:text-[9px]">▾</span>
      </button>
      {open && (
        <div className={`absolute top-full pt-2 z-[99999] ${alignRight ? 'right-0' : 'left-0'}`}>
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[200px] w-max max-w-[90vw]">
            {items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="inline-flex items-center h-[30px] text-[clamp(13.4px,1.8vw,16.8px)] font-medium leading-relaxed px-4 rounded-md hover:bg-accent hover:text-neon transition-colors whitespace-nowrap"
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
  const isPartnerPortal = pathname === '/programas' || pathname.startsWith('/programas/')
  const user = useSessionUser()
  const isLoggedIn = Boolean(user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isHome) return null

  const authBtn = (
    <Link href={isLoggedIn ? '/perfil' : '/login'}
      className="inline-flex items-center justify-center h-[30px] px-4 text-sm font-bold bg-foreground text-background rounded-[3px] transition-all hover:opacity-90 active:scale-95 shrink-0">
      {isLoggedIn ? 'Perfil' : 'Entrar'}
    </Link>
  )

  if (isPartnerPortal) {
    const portalLinks = (
      <>
        <Link href="/programas" className="inline-flex items-center h-[30px] text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Explorar</Link>
        <a href="/programas#sugestao" className="inline-flex items-center h-[30px] text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Sugerir site</a>
        <Link href="/contatos" className="inline-flex items-center h-[30px] text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Portal NKL</Link>
      </>
    )

    return (
      <header className="lg:fixed top-0 w-full z-[100] border-b border-border bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.2)] dark:bg-black dark:text-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-4 bg-white px-4 dark:bg-black">
          <Link href="/programas" className="group flex min-w-0 items-center gap-3">
            <Image src="/NKL/NKL.png" alt="NKL" width={38} height={38} className="h-9 w-9 shrink-0 rounded-full object-contain" />
            <span className="min-w-0">
              <span className="block truncate font-playfair text-xl font-bold tracking-tight">Blog NKL</span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] opacity-60 sm:block">Seu blog de confiança sobre tudo o que você precisa</span>
            </span>
          </Link>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex">{portalLinks}</nav>
          <div className="relative z-[99999] flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden">{authBtn}</span>
            <ThemeToggle />
            <button
              className="relative z-[110] flex h-[30px] w-[30px] items-center justify-center rounded-[3px] transition-colors hover:bg-accent lg:hidden"
              aria-label="Menu do Blog NKL"
              aria-expanded={menuOpen}
              aria-controls="partner-mobile-navigation"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="partner-mobile-navigation" className="flex flex-col gap-1 border-t border-border bg-white px-4 py-4 text-black dark:bg-black dark:text-white lg:hidden">
            {portalLinks}
            <span className="mt-2 sm:hidden">{authBtn}</span>
          </nav>
        )}
      </header>
    )
  }

  const navLinks = (
    <>
      <Link href="/" className="inline-flex items-center h-[30px] text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95 whitespace-nowrap" onClick={() => setMenuOpen(false)}>Home</Link>
      {groups.map((g) => <Dropdown key={g.label} label={g.label} items={g.items} />)}
      <Link href="/contatos" className="inline-flex items-center h-[30px] text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95 whitespace-nowrap" onClick={() => setMenuOpen(false)}>Contatos</Link>
    </>
  )

  const navLinkCls = 'inline-flex items-center h-[30px] text-[clamp(13.4px,1.8vw,16.8px)] max-[480px]:text-[11.2px] font-medium uppercase tracking-tight max-[480px]:tracking-[-0.03em] hover:text-neon transition-colors active:scale-95 whitespace-nowrap'

  const navLinksCompact = (
    <>
      <Link href="/" className={navLinkCls} onClick={() => setMenuOpen(false)}>Home</Link>
      {groups.map((g) => <DropdownCompact key={g.label} label={g.label} items={g.items} />)}
      <Link href="/contatos" className={navLinkCls} onClick={() => setMenuOpen(false)}>Contatos</Link>
    </>
  )

  const rawBgColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff'
  const bgColor = mounted ? rawBgColor : undefined

  return (
    <header suppressHydrationWarning style={bgColor ? { backgroundColor: bgColor } : undefined} className={`lg:fixed top-0 w-full z-[100] bg-white dark:bg-black border-b border-border transition-transform duration-300 ${scrolled && mounted ? 'lg:-translate-y-full' : 'lg:translate-y-0'}`}>
      {/* Row 1 */}
      <div className="max-w-[1200px] mx-auto px-4 h-[72px] flex items-center justify-between min-w-0 bg-white dark:bg-black">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <Image src="/NKL/NKL.png" alt="NKL" width={30} height={30} className="w-[30px] h-[30px] object-contain dark:invert shrink-0" />
          <Link href="/" className="font-playfair font-bold text-lg tracking-tight truncate">Portal</Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks}
        </div>

        <div className="relative z-[99999] flex items-start gap-2 sm:gap-3 shrink-0">
          <span className="inline-flex shrink-0">{authBtn}</span>
          <LangDropdown />
          <ThemeToggle />
          <button
            className="lg:hidden relative z-[110] w-[30px] h-[30px] p-0 flex items-center justify-center rounded-[3px] transition-colors hover:bg-accent"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Row 2 — mesma altura da row1, empurra o corpo pra baixo */}
      {menuOpen && (
        <div id="mobile-navigation" suppressHydrationWarning style={bgColor ? { backgroundColor: bgColor } : undefined} className="relative z-[105] lg:hidden bg-white dark:bg-black border-t border-border">
          <nav aria-label="Navegação secundária" className="flex w-full h-[72px] items-center justify-between px-[15px] gap-[15px] max-[600px]:gap-[clamp(3px,1.5vw,9px)] overflow-visible">
            {navLinksCompact}
          </nav>
        </div>
      )}
    </header>
  )
}
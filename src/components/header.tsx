'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { useSessionUser } from '@/components/use-session-user'
import { useTheme } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { PwaInstallButton } from '@/components/pwa'
import {
  INCOME_PORTAL_ROUTES,
  MUSIC_PORTAL_HOME,
  getPortalSurface,
  getSuggestionHref,
  isIncomePortalPath,
} from '@/lib/income-portal'
import { NotificationBell } from '@/components/notification-bell'
import { buildLoginPath } from '@/lib/auth/return-intent'

const groups = [
  {
    label: 'Cordas', items: [
      { href: '/catalogo', label: 'Catálogo' },
      { href: '/comparar', label: 'Comparador' },
      { href: '/guia-de-cordas', label: 'Gráfico' },
    ]
  },
  {
    label: 'Luteria', items: [
      { href: '/clinica', label: 'Clínica de Luteria' },
      { href: '/fisica-do-som', label: 'Física do Som' },
    ]
  },
  {
    label: 'Notícias', items: [
      { href: '/noticias', label: 'Notícias' },
      { href: '/noticias/anunciar', label: 'Anunciar' },
    ]
  },
  {
    label: 'Encontre um...', items: [
      { href: '/luthiers', label: 'Luthier' },
      { href: '/professores', label: 'Professor(a)' },
      { href: '/recomendados', label: 'Loja' },
    ]
  },
]

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
        className="inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors gap-1 active:scale-95">
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className={`absolute top-full pt-2 z-[99999] ${alignRight ? 'right-0' : 'left-0'}`}>
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[200px] w-max max-w-[90vw]">
            {items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm font-medium leading-relaxed px-4 rounded-md hover:bg-accent hover:text-neon transition-colors whitespace-nowrap"
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
        className="inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors gap-1 active:scale-95 whitespace-nowrap">
        <span className={label === 'Encontre um...' ? 'max-[480px]:hidden' : ''}>{label}</span>
        {label === 'Encontre um...' && <span className="hidden max-[480px]:inline">Encontre</span>}
        <span className="text-xs max-[480px]:text-[9px]">▾</span>
      </button>
      {open && (
        <div className={`absolute top-full pt-2 z-[99999] ${alignRight ? 'right-0' : 'left-0'}`}>
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[200px] w-max max-w-[90vw]">
            {items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm font-medium leading-relaxed px-4 rounded-md hover:bg-accent hover:text-neon transition-colors whitespace-nowrap"
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
  const mounted = useSyncExternalStore(() => () => { }, () => true, () => false)
  const pathname = usePathname()
  const surface = getPortalSurface(pathname)
  const isIncomeRoute = isIncomePortalPath(pathname)
  const { user, loading: sessionLoading } = useSessionUser()
  const isLoggedIn = Boolean(user)
  const loginArea = surface === 'music' ? 'music' : 'income'
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (surface === 'home') return null

  const authBtn = sessionLoading ? null : (
    <Link
      href={isLoggedIn ? '/minha-conta' : buildLoginPath(pathname, null, loginArea)}
      className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold bg-foreground text-background rounded-[3px] transition-opacity hover:opacity-90 active:scale-95 shrink-0"
    >
      {isLoggedIn ? 'Minha conta' : 'Entrar'}
    </Link>
  )

  if (surface === 'ecosystem') {
    const ecosystemLinkCls =
      'inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider hover:text-neon transition-colors whitespace-nowrap shrink-0'
    const portalLinks = (
      <>
        <Link href="/" className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>Início</Link>
        <Link href={INCOME_PORTAL_ROUTES.catalog} className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>Renda Extra</Link>
        <Link href="/ia" className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>IA</Link>
        <Link href="/idiomas" className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>Idiomas</Link>
        <Link href="/ofertas/bussola-negocios" className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>Bússola</Link>
        <Link href={MUSIC_PORTAL_HOME} className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>Cordas</Link>
        <Link href={getSuggestionHref(pathname)} className={ecosystemLinkCls} onClick={() => setMenuOpen(false)}>Sugerir</Link>
      </>
    )

    const brandHref = isIncomeRoute ? INCOME_PORTAL_ROUTES.catalog : '/'
    const brandTitle = isIncomeRoute ? 'Renda Extra' : 'Portal NKL'
    const brandSubtitle = isIncomeRoute
      ? 'Guias e oportunidades'
      : 'Guias e ferramentas NKL'

    return (
      <header className="relative z-[100] lg:fixed top-0 w-full border-b border-border bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.2)] dark:bg-black dark:text-white">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-3 bg-white px-4 py-1.5 dark:bg-black">
          <Link href={brandHref} className="group flex shrink-0 items-center gap-3">
            <Image src="/NKL/NKL.png" alt="Logo do Portal NKL" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-contain dark:invert" />
            <span className="min-w-0">
              <span className="block whitespace-nowrap font-playfair text-lg font-bold tracking-tight sm:text-xl">{brandTitle}</span>
              <span className="hidden text-[10px] uppercase tracking-[0.2em] opacity-60 xl:block">{brandSubtitle}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-3.5 xl:gap-5 lg:flex" aria-label="Navegação do Portal NKL">{portalLinks}</nav>
          <div className="relative z-[99999] flex shrink-0 items-center gap-2 sm:gap-2.5">
            {authBtn}
            {isLoggedIn && <NotificationBell href="/programas/notificacoes" area="income" />}
            <PwaInstallButton kind="income" />
            <ThemeToggle />
            <button
              className="relative z-[110] flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-accent lg:hidden"
              aria-label="Menu de Renda Extra"
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
          </nav>
        )}
      </header>
    )
  }

  const navLinks = (
    <>
      <Link href={MUSIC_PORTAL_HOME} className="inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95 whitespace-nowrap" onClick={() => setMenuOpen(false)}>Home</Link>
      {groups.map((g) => <Dropdown key={g.label} label={g.label} items={g.items} />)}
      <Link href="/contatos" className="inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95 whitespace-nowrap" onClick={() => setMenuOpen(false)}>Contatos</Link>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-md border border-border/80 px-2.5 text-xs font-semibold uppercase tracking-wider opacity-85 hover:border-neon hover:text-neon transition-colors whitespace-nowrap" onClick={() => setMenuOpen(false)}>Portal NKL</Link>
    </>
  )

  const navLinkCls = 'inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors active:scale-95 whitespace-nowrap'

  const navLinksCompact = (
    <>
      <Link href={MUSIC_PORTAL_HOME} className={navLinkCls} onClick={() => setMenuOpen(false)}>Home</Link>
      {groups.map((g) => <DropdownCompact key={g.label} label={g.label} items={g.items} />)}
      <Link href="/contatos" className={navLinkCls} onClick={() => setMenuOpen(false)}>Contatos</Link>
      <Link href="/" className={navLinkCls} onClick={() => setMenuOpen(false)}>Portal</Link>
    </>
  )

  const rawBgColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff'
  const bgColor = mounted ? rawBgColor : undefined

  return (
    <header suppressHydrationWarning style={bgColor ? { backgroundColor: bgColor } : undefined} className={`relative z-[100] lg:fixed top-0 w-full bg-white dark:bg-black border-b border-border transition-transform duration-300 ${scrolled && mounted ? 'lg:-translate-y-full' : 'lg:translate-y-0'}`}>
      {/* Row 1 */}
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between min-w-0 bg-white dark:bg-black">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <Image src="/NKL/NKL.png" alt="Logo do Portal NKL" width={30} height={30} className="w-[30px] h-[30px] object-contain dark:invert shrink-0" />
          <Link href={MUSIC_PORTAL_HOME} className="font-playfair font-bold text-lg tracking-tight truncate">NKL Cordas</Link>
          <Link href="/" className="hidden sm:inline-flex items-center rounded border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider opacity-75 hover:border-neon hover:text-neon transition-colors">
            Portal NKL
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks}
        </div>

        <div className="relative z-[99999] flex items-start gap-2 sm:gap-3 shrink-0">
          {authBtn}
          {isLoggedIn && <NotificationBell />}
          <PwaInstallButton kind="music" />
          <ThemeToggle />
          <button
            className="lg:hidden relative z-[110] flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-accent"
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
          <nav aria-label="Navegação secundária" className="flex w-full h-14 items-center justify-between px-[15px] gap-[15px] max-[600px]:gap-[clamp(3px,1.5vw,9px)] overflow-visible">
            {navLinksCompact}
          </nav>
        </div>
      )}
    </header>
  )
}

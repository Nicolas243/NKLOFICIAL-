'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signout } from '@/actions/auth'
import { NotificationBell } from '@/components/notification-bell'
import { useSmartHeader } from '@/components/use-smart-header'
import { ThemeToggle } from '@/components/theme-toggle'

type DropdownGroup = {
  label: string
  items: { href: string; label: string }[]
}

const groups: DropdownGroup[] = [
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
    { href: '/noticias', label: 'Anunciar' },
  ]},
  { label: 'Encontre um...', items: [
    { href: '/luthiers', label: 'Luthier' },
    { href: '/luthiers', label: 'Professor(a)' },
    { href: '/recomendados', label: 'Loja' },
  ]},
]

const LANG_PAIRS = [
  { top: '🇧🇷', bottom: '🇵🇹', label: 'PT' },
  { top: '🇲🇽', bottom: '🇪🇸', label: 'ES' },
  { top: '🇺🇸', bottom: '🇬🇧', label: 'EN' },
]

function DropdownDesktop({ group }: { group: DropdownGroup }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} className="relative z-[999]">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors flex items-center gap-1">
        {group.label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[220px]">
            {group.items.map((item) => (
              <li key={item.href}>
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

function DropdownMobile({ group }: { group: DropdownGroup }) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider opacity-60">
        {group.label} <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <ul className="pl-4 border-l-2 border-border ml-4 mb-2">
          {group.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block px-3 py-1.5 text-sm hover:text-neon transition-colors">{item.label}</Link>
            </li>
          ))}
                </ul>
      )}
    </li>
  )
}

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  useSmartHeader(isHome ? '' : '#site-header')

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore && data.user) {
        setIsLoggedIn(true)
        const name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || ''
        setUserName(name.split(' ')[0])
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setIsLoggedIn(Boolean(session?.user))
        if (session?.user) {
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
          setUserName(name.split(' ')[0])
        }
      }
    })
    return () => { ignore = true; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Esconde completamente na Home
  if (isHome) return null

  return (
    <header id="site-header" className="site-header fixed top-0 w-full z-[100] bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/NKL/NKL.png" alt="NKL" width={32} height={32} className="w-8 h-8 object-contain dark:invert" />
          <Link href="/" className="font-playfair font-bold text-lg tracking-tight">Portal</Link>
        </div>

        <ul className="hidden lg:flex items-center gap-6">
          {groups.map((g) => <li key={g.label}><DropdownDesktop group={g} /></li>)}
          <li><Link href="/contatos" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Contatos</Link></li>
        </ul>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div ref={userMenuRef} className="hidden sm:block relative z-[999]">
              <button onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-neon transition-colors">
                <User size={16} /> {userName} <span className="text-xs">▾</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full pt-2 z-50">
                  <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[180px]">
                    <li><Link href="/perfil" className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors" onClick={() => setUserMenuOpen(false)}>Meu Perfil</Link></li>
                    <li><Link href="/perfil/avaliacoes" className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors" onClick={() => setUserMenuOpen(false)}>Minhas Avaliações</Link></li>
                    <li><Link href="/perfil/privacidade" className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors" onClick={() => setUserMenuOpen(false)}>Configurações</Link></li>
                    <li><form action={signout}><button type="submit" className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors">Sair</button></form></li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90">Entrar</Link>
          )}
          <NotificationBell />

          {/* Bandeiras Gêmeas */}
          <div className="hidden sm:flex items-center gap-1.5">
            {LANG_PAIRS.map((pair) => (
              <div key={pair.label} title={pair.label} className="flex w-8 h-5 rounded overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                <span className="w-1/2 h-full flex items-center justify-center text-[10px] leading-none bg-background">{pair.top}</span>
                <span className="w-1/2 h-full flex items-center justify-center text-[10px] leading-none bg-background">{pair.bottom}</span>
              </div>
            ))}
          </div>

          <ThemeToggle />
          <button className="lg:hidden p-2" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur pb-4">
          <ul className="flex flex-col py-2">
            {groups.map((g) => <DropdownMobile key={g.label} group={g} />)}
            <li><Link href="/contatos" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Contatos</Link></li>
            {isLoggedIn ? (
              <>
                <li className="border-t border-border mt-2 pt-2"><Link href="/perfil" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Meu Perfil</Link></li>
                <li><form action={signout}><button type="submit" className="block w-full text-left px-4 py-2 text-sm hover:text-neon transition-colors">Sair</button></form></li>
              </>
            ) : (
              <li className="border-t border-border mt-2 pt-2 px-4"><Link href="/login" className="inline-block px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90" onClick={() => setMobileOpen(false)}>Entrar</Link></li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
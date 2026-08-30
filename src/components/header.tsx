'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
    <div ref={ref} className="relative z-[999]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        <FlagPair top="/flags/br.svg" bottom="/flags/pt.svg" />
      </button>
      {open && (
        <div className="absolute right-0 top-full pt-3 z-50">
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-2 flex flex-col gap-1">
            {LANG_OPTIONS.map((opt) => (
              <li key={opt.label}>
                <a href="#" className="block cursor-pointer hover:opacity-80 transition-opacity"
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

function DropdownDesktop({ group }: { group: DropdownGroup }) {
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
        className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors flex items-center gap-1 pointer-events-auto">
        {group.label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-[9999] pointer-events-auto">
          <div className="h-3" />
          <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[220px]">
            {group.items.map((item) => (
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
            <li key={item.label}>
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
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) setIsLoggedIn(Boolean(data.user))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setIsLoggedIn(Boolean(session?.user))
    })
    return () => { ignore = true; subscription.unsubscribe() }
  }, [])

  if (isHome) return null

  const authBtn = isLoggedIn
    ? <Link href="/perfil" className="hidden sm:inline-flex px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90">Perfil</Link>
    : <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90">Entrar</Link>

  const mobileAuth = isLoggedIn
    ? <li className="border-t border-border mt-2 pt-2 px-4"><Link href="/perfil" className="inline-block px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90" onClick={() => setMobileOpen(false)}>Perfil</Link></li>
    : <li className="border-t border-border mt-2 pt-2 px-4"><Link href="/login" className="inline-block px-4 py-2 text-sm font-bold bg-foreground text-background rounded-md transition-all hover:opacity-90" onClick={() => setMobileOpen(false)}>Entrar</Link></li>

  return (
    <header id="site-header" className="site-header fixed top-0 w-full z-[100] bg-white dark:bg-black border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/NKL/NKL.png" alt="NKL" width={32} height={32} className="w-8 h-8 object-contain dark:hidden" />
          <Image src="/NKL/NKL.png" alt="NKL" width={32} height={32} className="w-8 h-8 object-contain hidden dark:block invert" />
          <Link href="/" className="font-playfair font-bold text-lg tracking-tight">Portal</Link>
        </div>

        <ul className="hidden lg:flex items-stretch gap-6">
          <li className="flex items-center"><Link href="/" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Home</Link></li>
          {groups.map((g) => <li key={g.label} className="flex items-center"><DropdownDesktop group={g} /></li>)}
          <li className="flex items-center"><Link href="/contatos" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Contatos</Link></li>
        </ul>

        <div className="flex items-center gap-3">
          {authBtn}
          <LangDropdown />
          <ThemeToggle />
          <button className="lg:hidden p-2" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white dark:bg-black pb-4">
          <ul className="flex flex-col py-2">
            <li><Link href="/" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Home</Link></li>
            {groups.map((g) => <DropdownMobile key={g.label} group={g} />)}
            <li><Link href="/contatos" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Contatos</Link></li>
            {mobileAuth}
          </ul>
        </div>
      )}
    </header>
  )
}
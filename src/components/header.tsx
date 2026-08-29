'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
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
  {
    label: 'Cordas',
    items: [
      { href: '/catalogo', label: 'Catalogo' },
      { href: '/comparar', label: 'Comparar' },
      { href: '/guia-de-cordas', label: 'Grafico de Cordas' },
    ],
  },
  {
    label: 'Conteudo',
    items: [
      { href: '/fisica-do-som', label: 'Fisica do Som' },
      { href: '/clinica', label: 'Clinica de Lutheria' },
    ],
  },
  {
    label: 'Luthiers & Mercado',
    items: [
      { href: '/importacao', label: 'Importacao' },
      { href: '/recomendados', label: 'Recomendados' },
      { href: '/luthiers', label: 'Diretorio B2B' },
    ],
  },
]

function DropdownDesktop({ group }: { group: DropdownGroup }) {
  return (
    <li className="relative group">
      <span className="cursor-pointer text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">{group.label}</span>
      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <ul className="bg-surface border border-border rounded-lg shadow-xl py-2 px-1 min-w-[200px]">
          {group.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors whitespace-nowrap">{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function DropdownMobile({ group }: { group: DropdownGroup }) {
  return (
    <li>
      <span className="block px-4 py-2 text-sm font-bold uppercase tracking-wider opacity-60">{group.label}</span>
      <ul className="pl-4 border-l-2 border-border ml-4 mb-2">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="block px-3 py-1.5 text-sm hover:text-neon transition-colors">{item.label}</Link>
          </li>
        ))}
      </ul>
    </li>
  )
}
export function Header() {
  useSmartHeader('#site-header')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false
    supabase.auth.getUser().then(({ data }) => { if (!ignore) setIsLoggedIn(Boolean(data.user)) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setIsLoggedIn(Boolean(session?.user))
    })
    return () => { ignore = true; subscription.unsubscribe() }
  }, [])

  return (
    <header id="site-header" className="site-header fixed top-0 w-full z-50 bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-playfair font-bold text-xl tracking-tight shrink-0">NKL Portal</Link>

        {/* Desktop */}
        <ul className="hidden lg:flex items-center gap-6">
          <li><Link href="/" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Home</Link></li>
          {groups.map((g) => <DropdownDesktop key={g.label} group={g} />)}
          <li><Link href="/contatos" className="text-sm font-medium uppercase tracking-wider hover:text-neon transition-colors">Contatos</Link></li>
        </ul>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-3">
              <NotificationBell />
              <Link href="/meu-setup" className="text-sm font-medium hover:text-neon transition-colors">Meu Setup</Link>
              <Link href="/perfil" className="text-sm font-medium hover:text-neon transition-colors">Perfil</Link>
              <form action={signout}><button type="submit" className="text-sm font-medium hover:text-neon transition-colors">Sair</button></form>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-bold bg-text text-bg rounded-md transition-all hover:opacity-90">Entrar</Link>
          )}
          <ThemeToggle />
          <button className="lg:hidden p-2" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}><Menu size={24} /></button>
        </div>
      </nav>

      {/* Mobile */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur pb-4">
          <ul className="flex flex-col py-2">
            <li><Link href="/" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Home</Link></li>
            {groups.map((g) => <DropdownMobile key={g.label} group={g} />)}
            <li><Link href="/contatos" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Contatos</Link></li>
            {isLoggedIn ? (
              <>
                <li className="border-t border-border mt-2 pt-2"><Link href="/meu-setup" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Meu Setup</Link></li>
                <li><Link href="/perfil" className="block px-4 py-2 text-sm hover:text-neon transition-colors" onClick={() => setMobileOpen(false)}>Perfil</Link></li>
                <li><form action={signout}><button type="submit" className="block w-full text-left px-4 py-2 text-sm hover:text-neon transition-colors">Sair</button></form></li>
              </>
            ) : (
              <li className="border-t border-border mt-2 pt-2 px-4"><Link href="/login" className="inline-block px-4 py-2 text-sm font-bold bg-text text-bg rounded-md transition-all hover:opacity-90" onClick={() => setMobileOpen(false)}>Entrar</Link></li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { MUSIC_PORTAL_HOME } from '@/lib/income-portal'

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
    { href: '/lojas', label: 'Loja' },
    { href: '/professores', label: 'Professor(a)' },
  ]},
]

/**
 * Menu rapido de atalhos do Naipe de Cordas (/musica/naipe_cordas).
 * Nao renderiza na Portal Base Home (/), onde vigora AC-002.
 */
export function HomeMenuFallback() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onScroll = () => setScrolled(window.scrollY > 80)
    document.addEventListener('mousedown', fn)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', fn)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (pathname === '/') return null

  return (
    <div
      ref={ref}
      className={
        scrolled
          ? 'fixed top-3 left-3 z-[200] flex items-start gap-2'
          : 'relative z-30 -mb-14 flex items-start gap-2 self-start pt-2'
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu de navegação"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface/90 shadow-sm transition-colors hover:border-orange hover:bg-accent"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-surface border border-border rounded-xl shadow-xl p-4 flex flex-col gap-3">
          <Link
            href={MUSIC_PORTAL_HOME}
            onClick={() => setOpen(false)}
            className="font-playfair font-bold hover:text-neon transition-colors"
          >
            Naipe de Cordas
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold uppercase tracking-wider text-neon hover:underline"
          >
            Portal NKL (Início)
          </Link>
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                {group.label}
              </span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-sm opacity-85 hover:text-neon hover:opacity-100 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="/contatos"
            onClick={() => setOpen(false)}
            className="text-sm font-bold hover:text-neon transition-colors"
          >
            Contatos
          </Link>
        </div>
      )}
    </div>
  )
}

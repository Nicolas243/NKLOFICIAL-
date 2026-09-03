'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'

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
 * Tarefa 4 — fallback do menu hambúrguer no canto superior esquerdo da Home
 * (o Header principal é ocultado na Home em favor do menu radial).
 */
export function HomeMenuFallback() {
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
    <div ref={ref} className="fixed top-3 left-3 z-[200]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu de navegação"
        className="w-[38px] h-[38px] flex items-center justify-center rounded-md bg-surface/90 border border-border shadow-sm transition-colors hover:bg-accent"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-surface border border-border rounded-xl shadow-xl p-4 flex flex-col gap-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="font-playfair font-bold hover:text-neon transition-colors"
          >
            Home
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

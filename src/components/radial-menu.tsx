'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 6 fatias da pizza interativa
const SLICES = [
  { label: 'Catálogo', href: '/catalogo', desc: 'Catálogo completo de encordoamentos com métricas técnicas e avaliações da comunidade.', color: '#1E90FF' },
  { label: 'Luteria', href: '/luthiers', desc: 'Diretório de luthiers profissionais com portfólio e dados de contato.', color: '#0056b3' },
  { label: 'Notícias', href: '/noticias', desc: 'Últimas notícias, artigos e tutoriais do universo da lutheria.', color: '#3B82F6' },
  { label: 'Contatos', href: '/contatos', desc: 'Links oficiais, redes sociais e canais de atendimento.', color: '#60A5FA' },
  { label: 'Importação', href: '/importacao', desc: 'Guia completo para importar instrumentos com segurança.', color: '#2563EB' },
  { label: 'Comparar', href: '/comparar', desc: 'Use o comparador NKL para descobrir qual é a melhor corda para o seu violino.', color: '#93C5FD' },
]

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number
): string {
  const startX = cx + r * Math.cos(startAngle)
  const startY = cy + r * Math.sin(startAngle)
  const endX = cx + r * Math.cos(endAngle)
  const endY = cy + r * Math.sin(endAngle)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`
}

export function RadialMenu() {
  const router = useRouter()
  const [active, setActive] = useState<number | null>(null)

  const cx = 250; const cy = 250; const r = 200
  const sliceAngle = (2 * Math.PI) / SLICES.length

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-10 py-8">
      <svg viewBox="0 0 500 500" className="w-full max-w-[500px] h-auto">
        {/* Circulo central */}
        <circle cx={cx} cy={cy} r={80} className="fill-surface stroke-border stroke-2" />
        <text x={cx} y={cy - 12} textAnchor="middle" className="fill-text text-[11px] font-bold font-playfair">Tudo o que o</text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-text text-[11px] font-bold font-playfair">Portal NKL</text>
        <text x={cx} y={cy + 26} textAnchor="middle" className="fill-text text-[11px] font-bold font-playfair">oferece</text>

        {SLICES.map((slice, i) => {
          const startAngle = i * sliceAngle - Math.PI / 2
          const endAngle = (i + 1) * sliceAngle - Math.PI / 2
          const d = describeArc(cx, cy, r, startAngle, endAngle)
          const isActive = active === i

          return (
            <g key={slice.label}
              onClick={() => router.push(slice.href)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer"
              style={{ transition: 'transform 0.2s', transform: isActive ? 'scale(1.05)' : 'scale(1)', transformOrigin: `${cx}px ${cy}px` }}
            >
              <path d={d} fill={slice.color} fillOpacity={isActive ? 0.9 : 0.7} stroke="#fff" strokeWidth={1.5} />
              <text
                x={cx + (r - 40) * Math.cos(startAngle + sliceAngle / 2)}
                y={cy + (r - 40) * Math.sin(startAngle + sliceAngle / 2)}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-xs font-bold font-playfair pointer-events-none"
              >
                {slice.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Card descritivo da fatia ativa */}
      <div className="w-full max-w-sm min-h-[120px] p-6 bg-surface/80 backdrop-blur border border-border rounded-xl transition-all duration-300">
        {active !== null ? (
          <>
            <h3 className="font-playfair font-bold text-xl mb-2 text-neon">{SLICES[active].label}</h3>
            <p className="text-sm opacity-80">{SLICES[active].desc}</p>
          </>
        ) : (
          <p className="text-sm opacity-50 italic">Passe o mouse sobre uma fatia para explorar.</p>
        )}
      </div>
    </div>
  )
}
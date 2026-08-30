'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 5 fatias da pizza interativa — sem texto embutido, descricao no card lateral
const SLICES = [
  { label: 'Comparar', href: '/comparar', desc: 'Use o comparador NKL para descobrir qual é a melhor corda para o seu violino.', color: '#1E90FF' },
  { label: 'Catálogo', href: '/catalogo', desc: 'Lista completa das melhores cordas com métricas técnicas e avaliações reais.', color: '#0056b3' },
  { label: 'Notícias', href: '/noticias', desc: 'Últimas notícias, lançamentos e tutoriais do universo da lutheria.', color: '#3B82F6' },
  { label: 'Luteria', href: '/luthiers', desc: 'Diretório de luthiers profissionais com portfólio e dados de contato.', color: '#2563EB' },
  { label: 'Importação', href: '/importacao', desc: 'Guia completo para importar instrumentos e acessórios com segurança.', color: '#60A5FA' },
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
        <text x={cx} y={cy - 15} textAnchor="middle" className="fill-text text-[10px] font-bold font-playfair">Tudo o que o</text>
        <text x={cx} y={cy + 2} textAnchor="middle" className="fill-text text-[10px] font-bold font-playfair">Portal NKL tem</text>
        <text x={cx} y={cy + 20} textAnchor="middle" className="fill-text text-[10px] font-bold font-playfair">para oferecer</text>
        <text x={cx} y={cy + 36} textAnchor="middle" className="fill-text text-[10px] font-bold font-playfair">pra você</text>

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
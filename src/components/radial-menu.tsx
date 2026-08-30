'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 5 fatias da pizza interativa — monocromática, sem texto embutido
const SLICES = [
  { label: 'Comparar', href: '/comparar', desc: 'Cruze dados técnicos de tensão, durabilidade e timbre para escolher sua próxima corda.' },
  { label: 'Catálogo', href: '/catalogo', desc: 'Navegue pela maior lista de cordas classificadas da internet com preços e notas da comunidade.' },
  { label: 'Notícias', href: '/noticias', desc: 'As últimas novidades, lançamentos de equipamentos e estudos do mundo da lutheria.' },
  { label: 'Luteria', href: '/luthiers', desc: 'Entenda a física do som, os materiais e o segredo por trás dos grandes instrumentos.' },
  { label: 'Importação', href: '/importacao', desc: 'Método prático para importar instrumentos e acessórios pulando os atravessadores.' },
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

  const cx = 500; const cy = 500; const r = 420
  const sliceAngle = (2 * Math.PI) / SLICES.length

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-10 py-8">
      <svg viewBox="0 0 1000 1000" className="w-full max-w-[1000px] h-auto">
        {/* Círculo central */}
        <circle cx={cx} cy={cy} r={160} className="fill-surface stroke-border stroke-2" />
        <text x={cx} y={cy - 24} textAnchor="middle" className="fill-text text-[16px] font-bold font-playfair">Tudo o que o</text>
        <text x={cx} y={cy + 2} textAnchor="middle" className="fill-text text-[16px] font-bold font-playfair">Portal NKL tem</text>
        <text x={cx} y={cy + 28} textAnchor="middle" className="fill-text text-[16px] font-bold font-playfair">para oferecer</text>
        <text x={cx} y={cy + 54} textAnchor="middle" className="fill-text text-[16px] font-bold font-playfair">pra você</text>

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
              <path d={d}
                className={isActive
                  ? 'fill-foreground/20 stroke-border'
                  : 'fill-foreground/10 stroke-border'}
                strokeWidth={4}
              />
            </g>
          )
        })}
      </svg>

      {/* Card descritivo da fatia ativa */}
      <div className="w-full max-w-sm min-h-[140px] p-6 bg-surface/80 backdrop-blur border border-border rounded-xl transition-all duration-300">
        {active !== null ? (
          <>
            <h3 className="font-playfair font-bold text-xl mb-3 text-neon">{SLICES[active].label}</h3>
            <p className="text-sm opacity-80 leading-relaxed">{SLICES[active].desc}</p>
          </>
        ) : (
          <p className="text-sm opacity-40 italic">Passe o mouse sobre uma fatia para descobrir.</p>
        )}
      </div>
    </div>
  )
}
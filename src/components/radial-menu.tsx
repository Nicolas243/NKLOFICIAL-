'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SLICES = [
  { label: 'Comparar', href: '/comparar', brief: 'Comparar suas cordas', desc: 'Use o comparador NKL para cruzar dados técnicos de tensão, durabilidade e timbre e escolher sua próxima corda.' },
  { label: 'Catálogo', href: '/catalogo', brief: 'Lista das melhores cordas', desc: 'Navegue pela maior lista de cordas classificadas da internet com preços atualizados e notas da comunidade.' },
  { label: 'Notícias', href: '/noticias', brief: 'As últimas notícias', desc: 'Fique por dentro dos lançamentos de equipamentos, estudos acadêmicos e novidades do universo da lutheria.' },
  { label: 'Luteria', href: '/luthiers', brief: 'Entenda a lutheria', desc: 'Descubra a física do som, os materiais nobres e o segredo por trás dos grandes instrumentos de todos os tempos.' },
  { label: 'Importação', href: '/importacao', brief: 'Importar com segurança', desc: 'Método prático para importar instrumentos e acessórios sem dor de cabeça, pulando os atravessadores.' },
]

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
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

  const cx = 400; const cy = 400; const r = 360
  const sliceAngle = (2 * Math.PI) / SLICES.length

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <svg viewBox="0 0 800 800" className="w-full max-w-[800px] aspect-square">
        {/* Círculo central */}
        <circle cx={cx} cy={cy} r={120} className="fill-surface stroke-foreground stroke-[6px]" />
        <text x={cx} y={cy - 16} textAnchor="middle" className="fill-foreground text-[14px] font-bold font-playfair">Tudo o que o</text>
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-foreground text-[14px] font-bold font-playfair">Portal NKL tem</text>
        <text x={cx} y={cy + 28} textAnchor="middle" className="fill-foreground text-[14px] font-bold font-playfair">pra oferecer</text>

        {SLICES.map((slice, i) => {
          const startAngle = i * sliceAngle - Math.PI / 2
          const endAngle = (i + 1) * sliceAngle - Math.PI / 2
          const d = describeArc(cx, cy, r, startAngle, endAngle)
          const isActive = active === i
          const midAngle = startAngle + sliceAngle / 2
          const tx = cx + (r - 90) * Math.cos(midAngle)
          const ty = cy + (r - 90) * Math.sin(midAngle)

          return (
            <g key={slice.label}
              onClick={() => router.push(slice.href)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer"
              style={{
                transition: 'transform 0.3s ease-out',
                transform: isActive ? `scale(1.1) translate(${(cx - cx) * 0.1}px, ${(cy - cy) * 0.1}px)` : 'scale(1)',
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              <path d={d}
                className={isActive ? 'fill-foreground/15 stroke-foreground' : 'fill-foreground/08 stroke-foreground'}
                strokeWidth={6}
              />
              {/* Texto embutido na fatia */}
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
                className="fill-foreground text-[12px] font-bold font-playfair pointer-events-none">
                {isActive ? slice.desc.split('.')[0] + '.' : slice.brief}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
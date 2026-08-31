'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SLICES = [
  { label: 'Catálogo', href: '/catalogo', desc: 'Explore a maior biblioteca de cordas com avaliações reais.' },
  { label: 'Comparador', href: '/comparar', desc: 'Compare tensão, durabilidade e timbre lado a lado.' },
  { label: 'Clínica', href: '/clinica', desc: 'Cuidados, reparos e segredos da bancada do luthier.' },
  { label: 'Física do Som', href: '/fisica-do-som', desc: 'Entenda a ciência por trás do som do seu instrumento.' },
  { label: 'Notícias', href: '/noticias', desc: 'As últimas novidades do mundo da música.' },
  { label: 'Professores', href: '/professores', desc: 'Encontre professores de música perto de você.' },
  { label: 'Lojas', href: '/lojas', desc: 'Descubra lojas de instrumentos e acessórios.' },
  { label: 'Luthier', href: '/luthiers', desc: 'Conecte-se com luthiers profissionais verificados.' },
  { label: 'Contatos', href: '/contatos', desc: 'Fale conosco: parcerias e redes sociais.' },
]

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const sx = cx + r * Math.cos(startAngle)
  const sy = cy + r * Math.sin(startAngle)
  const ex = cx + r * Math.cos(endAngle)
  const ey = cy + r * Math.sin(endAngle)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`
}

export function RadialMenu() {
  const router = useRouter()
  const [active, setActive] = useState<number | null>(null)

  const cx = 400
  const cy = 400
  const r = 370
  const midR = r * 0.63
  const step = (2 * Math.PI) / SLICES.length

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 800 800"
        className="h-[calc(100vh-40px)] w-auto aspect-square max-w-full portrait:w-[calc(100vw-40px)] portrait:h-auto"
      >
        {SLICES.map((slice, i) => {
          const start = i * step - Math.PI / 2
          const end = (i + 1) * step - Math.PI / 2
          const mid = start + step / 2
          const d = describeArc(cx, cy, r, start, end)
          const isHovered = active === i
          const fx = cx + midR * Math.cos(mid)
          const fy = cy + midR * Math.sin(mid)

          return (
            <g
              key={slice.label}
              onClick={() => router.push(slice.href)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer"
              style={{
                transition: 'transform 0.3s ease-out',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              <path
                d={d}
                className={isHovered ? 'fill-foreground/20 stroke-foreground' : 'fill-foreground/10 stroke-foreground'}
                strokeWidth={5}
              />
              <foreignObject
                x={fx - 115}
                y={fy - 38}
                width={230}
                height={76}
                style={{ overflow: 'hidden' }}
                className="pointer-events-none"
              >
                <div className="w-full h-full flex items-center justify-center text-center px-1">
                  {isHovered ? (
                    <span className="text-foreground font-semibold text-[clamp(8px,1.05vw,12px)] leading-snug">
                      {slice.desc}
                    </span>
                  ) : (
                    <span className="text-foreground font-playfair font-bold text-[clamp(9px,1.2vw,14px)]">
                      {slice.label}
                    </span>
                  )}
                </div>
              </foreignObject>
            </g>
          )
        })}

        {/* Centro — esconde a união das fatias */}
        <circle cx={cx} cy={cy} r={130} className="fill-background stroke-foreground" strokeWidth={4} />
        <foreignObject
          x={cx - 100}
          y={cy - 55}
          width={200}
          height={110}
          style={{ overflow: 'hidden' }}
          className="pointer-events-none"
        >
          <div className="w-full h-full flex items-center justify-center text-center px-2">
            <span className="text-foreground font-playfair font-bold text-[clamp(11px,1.4vw,16px)] leading-tight">
              Tudo que o Portal NKL tem para você
            </span>
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}
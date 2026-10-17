'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SliceData {
  label: string
  desc: string
  href: string
  notes: Array<{
    s: string // símbolo musical
    r: number // fator de raio (0 a 1)
    a: number // offset angular
    sz: number // tamanho da fonte
    o: number // opacidade base
  }>
}

const SLICES: SliceData[] = [
  {
    label: 'Lista com todas as cordas atuais detalhadas',
    desc: 'Catálogo completo com especificações técnicas, tensões, núcleos e avaliações.',
    href: '/catalogo',
    notes: [
      { s: '𝄞', r: 0.35, a: -0.16, sz: 17, o: 0.5 },
      { s: '♪', r: 0.78, a: 0.18, sz: 16, o: 0.6 },
      { s: '♫', r: 0.88, a: -0.15, sz: 19, o: 0.5 },
      { s: '𝄢', r: 0.45, a: 0.17, sz: 16, o: 0.4 },
      { s: '♩', r: 0.90, a: 0.05, sz: 15, o: 0.55 },
    ],
  },
  {
    label: 'Comparativo lado a lado de tensão e timbre',
    desc: 'Compare sonoridade, durabilidade, resposta e custo-benefício de múltiplos jogos.',
    href: '/comparar',
    notes: [
      { s: '♬', r: 0.38, a: 0.15, sz: 18, o: 0.5 },
      { s: '♩', r: 0.75, a: -0.18, sz: 16, o: 0.6 },
      { s: '♭', r: 0.86, a: 0.16, sz: 15, o: 0.5 },
      { s: '𝄞', r: 0.50, a: -0.20, sz: 16, o: 0.45 },
      { s: '♫', r: 0.92, a: -0.06, sz: 17, o: 0.55 },
    ],
  },
  {
    label: 'Guia de cuidados, reparos e manutenção',
    desc: 'Artigos de lutheria, diagnóstico de ruídos, ajustes de alma, pestana e cavalete.',
    href: '/clinica',
    notes: [
      { s: '𝄢', r: 0.36, a: -0.15, sz: 17, o: 0.5 },
      { s: '♫', r: 0.80, a: 0.17, sz: 18, o: 0.55 },
      { s: '♪', r: 0.89, a: -0.16, sz: 15, o: 0.6 },
      { s: '♯', r: 0.48, a: 0.20, sz: 14, o: 0.45 },
      { s: '♬', r: 0.91, a: 0.08, sz: 17, o: 0.5 },
    ],
  },
  {
    label: 'Ciência acústica e física do seu instrumento',
    desc: 'Entenda os harmônicos, densidade linear, vibrações de cordas e projeção sonora.',
    href: '/fisica-do-som',
    notes: [
      { s: '𝄞', r: 0.34, a: 0.16, sz: 18, o: 0.5 },
      { s: '♩', r: 0.77, a: -0.17, sz: 16, o: 0.6 },
      { s: '♬', r: 0.87, a: 0.15, sz: 17, o: 0.55 },
      { s: '♭', r: 0.52, a: -0.19, sz: 15, o: 0.45 },
      { s: '♪', r: 0.90, a: -0.05, sz: 15, o: 0.5 },
    ],
  },
  {
    label: 'Artigos e novidades do mundo da lutheria',
    desc: 'Lançamentos de marcas, inovações em encordoamentos e notícias do meio musical.',
    href: '/noticias',
    notes: [
      { s: '♫', r: 0.37, a: -0.17, sz: 18, o: 0.5 },
      { s: '♪', r: 0.79, a: 0.18, sz: 15, o: 0.6 },
      { s: '𝄢', r: 0.88, a: -0.14, sz: 16, o: 0.45 },
      { s: '♩', r: 0.46, a: 0.21, sz: 16, o: 0.55 },
      { s: '♯', r: 0.92, a: 0.06, sz: 14, o: 0.45 },
    ],
  },
  {
    label: 'Encontre os melhores professores de música',
    desc: 'Diretório completo de instrutores de violino, viola e cello perto de você.',
    href: '/professores',
    notes: [
      { s: '♬', r: 0.35, a: 0.16, sz: 17, o: 0.5 },
      { s: '𝄞', r: 0.76, a: -0.19, sz: 17, o: 0.5 },
      { s: '♩', r: 0.86, a: 0.17, sz: 16, o: 0.6 },
      { s: '♭', r: 0.49, a: -0.20, sz: 15, o: 0.45 },
      { s: '♫', r: 0.91, a: -0.07, sz: 18, o: 0.55 },
    ],
  },
  {
    label: 'Guia de lojas parceiras e instrumentos',
    desc: 'Lojas confiáveis com descontos e catálogo verificado de acessórios musicais.',
    href: '/lojas',
    notes: [
      { s: '♩', r: 0.38, a: -0.16, sz: 16, o: 0.6 },
      { s: '♫', r: 0.78, a: 0.16, sz: 18, o: 0.55 },
      { s: '♪', r: 0.87, a: -0.17, sz: 15, o: 0.5 },
      { s: '𝄢', r: 0.51, a: 0.19, sz: 16, o: 0.4 },
      { s: '♯', r: 0.90, a: 0.08, sz: 14, o: 0.45 },
    ],
  },
  {
    label: 'Luthiers profissionais verificados no Brasil',
    desc: 'Ateliês renomados, orçamentos rápidos e contato direto via WhatsApp oficial.',
    href: '/luthiers',
    notes: [
      { s: '𝄞', r: 0.36, a: 0.17, sz: 17, o: 0.5 },
      { s: '♬', r: 0.81, a: -0.18, sz: 18, o: 0.55 },
      { s: '♭', r: 0.89, a: 0.15, sz: 15, o: 0.45 },
      { s: '♩', r: 0.47, a: -0.21, sz: 16, o: 0.6 },
      { s: '♪', r: 0.92, a: -0.05, sz: 15, o: 0.5 },
    ],
  },
  {
    label: 'Fale conosco, parcerias e redes sociais',
    desc: 'Atendimento direto com a equipe NKL para dúvidas, suporte e anúncios.',
    href: '/contatos',
    notes: [
      { s: '♫', r: 0.35, a: -0.15, sz: 18, o: 0.5 },
      { s: '♪', r: 0.77, a: 0.19, sz: 16, o: 0.6 },
      { s: '𝄞', r: 0.88, a: -0.16, sz: 17, o: 0.5 },
      { s: '♯', r: 0.50, a: 0.18, sz: 14, o: 0.45 },
      { s: '♩', r: 0.91, a: 0.05, sz: 15, o: 0.55 },
    ],
  },
]

const COORDINATE_PRECISION = 100

function roundCoord(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const sx = roundCoord(cx + r * Math.cos(startAngle))
  const sy = roundCoord(cy + r * Math.sin(startAngle))
  const ex = roundCoord(cx + r * Math.cos(endAngle))
  const ey = roundCoord(cy + r * Math.sin(endAngle))
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${roundCoord(cx)} ${roundCoord(cy)} L ${sx} ${sy} A ${roundCoord(r)} ${roundCoord(r)} 0 ${large} 1 ${ex} ${ey} Z`
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
          const fx = roundCoord(cx + midR * Math.cos(mid))
          const fy = roundCoord(cy + midR * Math.sin(mid))

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

              {/* Símbolos musicais de preenchimento que se expandem no hover */}
              {slice.notes.map((n, idx) => {
                const noteRadius = 130 + (r - 130) * n.r * (isHovered ? 1.08 : 1)
                const noteAngle = mid + n.a
                const nx = roundCoord(cx + noteRadius * Math.cos(noteAngle))
                const ny = roundCoord(cy + noteRadius * Math.sin(noteAngle))
                return (
                  <text
                    key={idx}
                    x={nx}
                    y={ny}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={n.sz}
                    fill="currentColor"
                    className="select-none pointer-events-none transition-all duration-300 fill-foreground"
                    style={{
                      opacity: isHovered ? Math.min(n.o * 1.5, 0.9) : n.o * 0.4,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      transformOrigin: `${nx}px ${ny}px`,
                    }}
                  >
                    {n.s}
                  </text>
                )
              })}

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
                    <span className="text-foreground font-semibold text-[clamp(9px,1.15vw,13px)] leading-snug">
                      {slice.desc}
                    </span>
                  ) : (
                    <span className="text-foreground font-playfair font-bold text-[clamp(10px,1.3vw,15px)]">
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
          x={cx - 110}
          y={cy - 65}
          width={220}
          height={130}
          style={{ overflow: 'hidden' }}
          className="pointer-events-none"
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-2">
            <span className="text-foreground font-playfair font-bold text-[clamp(13px,1.8vw,22px)] leading-tight tracking-tight uppercase">
              Tudo que o Portal NKL tem para você
            </span>
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}
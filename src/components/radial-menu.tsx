'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

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
const SYMBOL_COUNT = 18

function roundCoord(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION
}

function seededValue(sliceIndex: number, noteIndex: number, salt: number): number {
  const value = Math.sin((sliceIndex + 1) * 91.7 + (noteIndex + 1) * 37.3 + salt * 17.1) * 43758.5453
  return value - Math.floor(value)
}

function wrapText(text: string, maxCharacters: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && candidate.length > maxCharacters) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }

  if (line) lines.push(line)
  return lines
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
  const touchActive = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const cx = 400
  const cy = 400
  const r = 370
  const step = (2 * Math.PI) / SLICES.length

  return (
    <div className="radial-menu-intro relative z-10 flex pointer-events-auto items-center justify-center overflow-visible p-[clamp(18px,4vw,56px)]">
      <svg
        viewBox="0 0 800 800"
        className="pointer-events-auto h-[calc(100vh-40px)] w-auto aspect-square max-w-full overflow-visible portrait:w-[calc(100vw-40px)] portrait:h-auto"
      >
        {SLICES.map((slice, i) => {
          const start = i * step - Math.PI / 2
          const end = (i + 1) * step - Math.PI / 2
          const mid = start + step / 2
          const d = describeArc(cx, cy, r, start, end)
          const isHovered = active === i
          const labelRadius = 252
          const labelX = roundCoord(cx + labelRadius * Math.cos(mid))
          const labelY = roundCoord(cy + labelRadius * Math.sin(mid))
          const mobileLabelRadius = 218
          const mobileLabelX = roundCoord(cx + mobileLabelRadius * Math.cos(mid))
          const mobileLabelY = roundCoord(cy + mobileLabelRadius * Math.sin(mid))
          const symbol = slice.notes[0]?.s ?? '♪'
          const hoverDistance = 30
          const hoverX = roundCoord(hoverDistance * Math.cos(mid))
          const hoverY = roundCoord(hoverDistance * Math.sin(mid))
          const symbolPositions: Array<{ x: number; y: number }> = []
          let attempts = 0

          while (symbolPositions.length < SYMBOL_COUNT && attempts < 500) {
            const idx = attempts
            const noteRadius = 148 + seededValue(i, idx, 1) * 205
            const angleOffset = (seededValue(i, idx, 2) - 0.5) * step * 0.82
            const noteAngle = mid + angleOffset
            const nx = roundCoord(cx + noteRadius * Math.cos(noteAngle))
            const ny = roundCoord(cy + noteRadius * Math.sin(noteAngle))
            const isFarEnough = symbolPositions.every((position) => {
              const dx = position.x - nx
              const dy = position.y - ny
              return Math.hypot(dx, dy) >= 29
            })

            if (isFarEnough) symbolPositions.push({ x: nx, y: ny })
            attempts += 1
          }

          return (
            <g
              key={slice.label}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false
                  return
                }
                router.push(slice.href)
              }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => {
                if (touchActive.current !== i) setActive(null)
              }}
              onTouchStart={(event) => {
                event.preventDefault()
                suppressClick.current = true
                if (touchActive.current === i) {
                  touchActive.current = null
                  router.push(slice.href)
                  return
                }
                touchActive.current = i
                setActive(i)
              }}
              onTouchCancel={() => {
                touchActive.current = null
                suppressClick.current = false
                setActive(null)
              }}
              className="cursor-pointer"
              style={{
                transition: 'transform 0.3s ease-out',
                transform: isHovered
                  ? `translate(${hoverX}px, ${hoverY}px) scale(1.18)`
                  : 'translate(0, 0) scale(1)',
                transformOrigin: `${cx}px ${cy}px`,
                touchAction: 'manipulation',
              }}
            >
              <path
                d={d}
                className={isHovered ? 'fill-foreground/20 stroke-foreground' : 'fill-foreground/10 stroke-foreground'}
                strokeWidth={5}
              />

              <clipPath id={`slice-clip-${i}`}>
                <path d={d} />
              </clipPath>

              {/* Um único símbolo repetido cria a textura visual de cada fatia. */}
              <g clipPath={isHovered ? undefined : `url(#slice-clip-${i})`}>
                {symbolPositions.map(({ x: nx, y: ny }, idx) => {
                const dx = nx - cx
                const dy = ny - cy
                const radius = Math.hypot(dx, dy)
                const angle = Math.atan2(dy, dx)
                const pushedRadius = isHovered ? radius + 116 + seededValue(i, idx, 4) * 38 : radius
                const pushedAngle = isHovered
                  ? angle + (seededValue(i, idx, 5) - 0.5) * 0.16
                  : angle
                const symbolX = roundCoord(cx + pushedRadius * Math.cos(pushedAngle))
                const symbolY = roundCoord(cy + pushedRadius * Math.sin(pushedAngle))
                const opacity = (isHovered ? 0.3 : 0.13 + seededValue(i, idx, 3) * 0.08).toFixed(6)
                const symbolScale = isHovered ? 1.1 : 1
                const symbolTransform = `translate(${symbolX} ${symbolY}) scale(${symbolScale}) translate(${-symbolX} ${-symbolY})`
                return (
                  <text
                    key={idx}
                    x={symbolX}
                    y={symbolY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isHovered ? 30 : 26.4}
                    fill="currentColor"
                    opacity={opacity}
                    transform={symbolTransform}
                    className="select-none pointer-events-none fill-foreground transition-all duration-300"
                  >
                    {symbol}
                  </text>
                )
                })}

                <g clipPath={`url(#slice-clip-${i})`}>
                  {(isHovered ? wrapText(slice.desc, 18) : wrapText(slice.label, 15)).map((line, lineIndex, lines) => (
                    <text
                      key={`${line}-${lineIndex}`}
                      x={labelX}
                      y={labelY + (lineIndex - (lines.length - 1) / 2) * (isHovered ? 23 : 22)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`${isHovered
                        ? 'radial-menu-desktop-label radial-menu-description fill-foreground font-semibold select-none pointer-events-none'
                        : 'radial-menu-desktop-label radial-menu-label fill-foreground font-playfair font-bold select-none pointer-events-none'}`}
                    >
                      {line}
                    </text>
                  ))}
                </g>

                <g className="radial-menu-mobile-copy" clipPath={`url(#slice-clip-${i})`}>
                  {(isHovered ? wrapText(slice.desc, 18) : wrapText(slice.label, 15)).map((line, lineIndex, lines) => (
                    <text
                      key={`mobile-${line}-${lineIndex}`}
                      x={mobileLabelX}
                      y={mobileLabelY + (lineIndex - (lines.length - 1) / 2) * (isHovered ? 26 : 25)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`${isHovered
                        ? 'radial-menu-label radial-menu-description fill-foreground font-semibold select-none pointer-events-none'
                        : 'radial-menu-label fill-foreground font-playfair font-bold select-none pointer-events-none'}`}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              </g>
            </g>
          )
        })}

        {/* Centro — esconde a união das fatias */}
        <circle cx={cx} cy={cy} r={130} className="fill-background stroke-foreground" strokeWidth={4} />
        <foreignObject
          x={cx - 125}
          y={cy - 100}
          width={250}
          height={200}
          style={{ overflow: 'hidden' }}
          className="pointer-events-none"
        >
          <div className="radial-menu-center-box w-full h-full flex flex-col items-center justify-center text-center">
            <span className="radial-menu-center-line text-foreground font-playfair font-bold leading-tight tracking-tight uppercase">
              Tudo que
            </span>
            <span className="radial-menu-center-line text-foreground font-playfair font-bold leading-tight tracking-tight uppercase">
              o Portal NKL
            </span>
            <span className="radial-menu-center-line text-foreground font-playfair font-bold leading-tight tracking-tight uppercase">
              tem pra você
            </span>
          </div>
        </foreignObject>
      </svg>
      <p className="lg:hidden absolute bottom-0 left-1/2 w-[min(92vw,360px)] -translate-x-1/2 text-center text-xs font-medium text-foreground/75">
        Primeiro toque: abrir a fatia. Segundo toque: acessar.
      </p>
    </div>
  )
}
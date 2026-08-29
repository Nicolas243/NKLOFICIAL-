'use client'

import { useEffect, useRef, useState } from 'react'

const LUTHIERS = [
  'Antonio Stradivari','Messiah 1716','Soil 1714','Betts 1704',
  'Giuseppe Guarneri','Il Cannone 1743','Lord Wilton 1742','Vieuxtemps 1741',
  'Nicolo Amati','Alard 1649','King Henry IV 1595','Hammerle 1658',
  'Andrea Amati','Charles IX 1564','The King 1572','Kurtz 1560',
  'Gasparo da Salo','Kievman 1590','Treasury 1580','Hussey 1585',
  'G.P. Maggini','Dumas 1615','De Beriot 1620','Sainte Cecile 1625',
  'Jacob Stainer','Stainer 1658','Stainer 1668','Stainer 1679',
  'Carlo Bergonzi','Kreisler 1740','Baron Knoop 1733','Perlman 1735',
  'G.B. Guadagnini','Ex-Vieuxtemps 1750','Wieniawski 1753','Grumiaux 1773',
  'J.B. Vuillaume','Evangeliste 1845','Ysaye 1865','Carrodus 1850',
]

const SYMBOLS = [
  '\u{1D11E}','\u{1D121}','\u{1D122}','\u2669','\u266A','\u266B','\u266C',
  '\u{1D13E}','\u{1D13F}','\u{1D140}','\u266F','\u266D','\u266E',
  '\u{1D106}','\u{1D107}','\u{1D110}','\u{1D12A}',
]

interface Cell { left: number; top: number; rotate: number; text: string; isSymbol: boolean }

function sh<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

function buildGrid(): Cell[] {
  const W = window.innerWidth * 2
  const H = window.innerHeight * 2
  const cw = 360; const ch = 110
  const cols = Math.ceil(W / cw) + 1; const rows = Math.ceil(H / ch)
  let poolL = sh([...LUTHIERS]); let poolS = sh([...SYMBOLS])
  const next = (): { t: string; s: boolean } => {
    if (!poolL.length) poolL = sh([...LUTHIERS])
    if (!poolS.length) poolS = sh([...SYMBOLS])
    return Math.random() < 0.75 ? { t: poolL.pop()!, s: false } : { t: poolS.pop()!, s: true }
  }
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1; const rc = odd ? cols - 1 : cols
    for (let c = 0; c < rc; c++) {
      const { t, s } = next()
      let left = c * cw + cw / 2 + (Math.random() * 30 - 15)
      if (odd) left += cw / 2
      cells.push({ left, top: r * ch + ch / 2 + (Math.random() * 20 - 10), rotate: Math.floor(Math.random() * 20) - 10, text: t, isSymbol: s })
    }
  }
  return cells
}

export function ParallaxBackground() {
  const [grid] = useState<Cell[]>(() =>
    typeof window !== 'undefined' ? buildGrid() : []
  )
  const l1 = useRef<HTMLDivElement>(null)
  const l2 = useRef<HTMLDivElement>(null)
  const mx = useRef(0)

  // Mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mx.current = (e.clientX - window.innerWidth / 2) * 0.4 }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // rAF loop para parallax (60fps suave, nao depende de scroll event)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const y = window.scrollY * 1.55
      const t = `translate(${mx.current}px, ${-y}px)`
      if (l1.current) l1.current.style.transform = t
      if (l2.current) l2.current.style.transform = t
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!grid.length) return null

  return (
    <>
      {/* Camada do parallax: fundo animado */}
      <div className="fixed inset-0 overflow-hidden z-[-2] pointer-events-none">
        <div ref={l1} className="absolute" style={{ width: '200vw', height: '200vh', left: '50%', marginLeft: '-100vw' }}>
          {grid.map((c, i) => (
            <span key={`p1-${i}`}
              className={c.isSymbol
                ? 'parallax-music-symbol font-playfair opacity-15 text-neon'
                : 'parallax-violin-name font-playfair italic font-bold opacity-12 text-neon text-2xl'}
              style={{ position: 'absolute', left: c.left, top: c.top, transform: `translate(-50%,-50%) rotate(${c.rotate}deg)`, whiteSpace: 'nowrap' }}
            >{c.text}</span>
          ))}
        </div>
        <div ref={l2} className="absolute" style={{ width: '200vw', height: '200vh', left: '50%', marginLeft: '-100vw' }}>
          {grid.map((c, i) => (
            <span key={`p2-${i}`}
              className={c.isSymbol
                ? 'parallax-music-symbol font-playfair opacity-15 text-neon'
                : 'parallax-violin-name font-playfair italic font-bold opacity-12 text-neon text-2xl'}
              style={{ position: 'absolute', left: c.left, top: c.top, transform: `translate(-50%,-50%) rotate(${c.rotate}deg)`, whiteSpace: 'nowrap' }}
            >{c.text}</span>
          ))}
        </div>
      </div>
      {/* Overlay translucido entre o parallax e o conteudo */}
      <div className="fixed inset-0 bg-surface/80 backdrop-blur-[2px] z-[-1] pointer-events-none" />
    </>
  )
}
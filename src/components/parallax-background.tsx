'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

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

function sh<T>(a: readonly T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

function buildGrid(): Cell[] {
  const W = window.innerWidth * 3
  const H = window.innerHeight * 3
  const cw = 280; const ch = 90
  const cols = Math.ceil(W / cw) + 2; const rows = Math.ceil(H / ch) + 1
  let poolL = sh(LUTHIERS); let poolS = sh(SYMBOLS)
  const next = (): { t: string; s: boolean } => {
    if (!poolL.length) poolL = sh(LUTHIERS)
    if (!poolS.length) poolS = sh(SYMBOLS)
    return Math.random() < 0.75 ? { t: poolL.pop()!, s: false } : { t: poolS.pop()!, s: true }
  }
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1; const rc = odd ? cols - 1 : cols
    for (let c = 0; c < rc; c++) {
      const { t, s } = next()
      let left = c * cw + cw / 2 + (Math.random() * 30 - 15)
      if (odd) left += cw / 2
      cells.push({
        left,
        top: r * ch + ch / 2 + (Math.random() * 20 - 10),
        rotate: Math.floor(Math.random() * 20) - 10,
        text: t,
        isSymbol: s,
      })
    }
  }
  return cells
}

export function ParallaxBackground() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  // Lazily build grid on first render (client-only via typeof guard; SSR returns empty)
  const [grid] = useState<Cell[]>(() =>
    typeof window !== 'undefined' ? buildGrid() : []
  )
  const l1 = useRef<HTMLDivElement>(null)
  const l2 = useRef<HTMLDivElement>(null)
  const mx = useRef(0)

  const onMove = useCallback((e: MouseEvent) => {
    mx.current = (e.clientX - window.innerWidth / 2) * 0.4
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [onMove])

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

  if (!mounted || !grid.length) return null

  return (
    <>
      <div className="fixed inset-0 overflow-hidden z-[-2] pointer-events-none">
        <div ref={l1} className="absolute" style={{ width: '300vw', height: '300vh', left: '50%', marginLeft: '-150vw' }}>
          {grid.map((c, i) => (
            <span key={`p1-${i}`}
              className={c.isSymbol ? 'font-playfair opacity-10 text-neon' : 'font-playfair italic font-bold opacity-8 text-neon text-3xl'}
              style={{ position: 'absolute', left: c.left, top: c.top, transform: `translate(-50%,-50%) rotate(${c.rotate}deg)`, whiteSpace: 'nowrap' }}
            >{c.text}</span>
          ))}
        </div>
        <div ref={l2} className="absolute" style={{ width: '300vw', height: '300vh', left: '50%', marginLeft: '-150vw' }}>
          {grid.map((c, i) => (
            <span key={`p2-${i}`}
              className={c.isSymbol ? 'font-playfair opacity-10 text-neon' : 'font-playfair italic font-bold opacity-8 text-neon text-3xl'}
              style={{ position: 'absolute', left: c.left, top: c.top, transform: `translate(-50%,-50%) rotate(${c.rotate}deg)`, whiteSpace: 'nowrap' }}
            >{c.text}</span>
          ))}
        </div>
      </div>
      <div className="fixed inset-0 bg-surface/60 backdrop-blur-sm z-[-1] pointer-events-none" />
    </>
  )
}
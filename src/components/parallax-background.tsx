'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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

interface Cell {
  x: number; y: number; rotate: number; text: string; isSymbol: boolean
}

interface State { grid: Cell[]; w: number; h: number }

function sh<T>(a: readonly T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

function buildGrid(w: number, h: number): Cell[] {
  const cw = 300; const ch = 110
  const cols = Math.ceil(w / cw) + 2; const rows = Math.ceil(h / ch) + 2
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
      let x = c * cw + cw / 2 + (Math.random() * 30 - 15)
      if (odd) x += cw / 2
      cells.push({ x, y: r * ch + ch / 2 + (Math.random() * 20 - 10), rotate: Math.floor(Math.random() * 20) - 10, text: t, isSymbol: s })
    }
  }
  return cells
}

export function ParallaxBackground() {
  const [state, setState] = useState<State | null>(null)
  const layerA = useRef<HTMLDivElement>(null)
  const layerB = useRef<HTMLDivElement>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window.innerWidth * 3
    const h = window.innerHeight * 3
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ grid: buildGrid(w, h), w, h })
  }, [])

  const onMove = useCallback((e: MouseEvent) => {
    pointer.current.x = (e.clientX - window.innerWidth / 2) * 0.08
    pointer.current.y = (e.clientY - window.innerHeight / 2) * 0.08
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [onMove])

  // rAF loop — wraps position within grid bounds for infinite scroll
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const w = window.innerWidth * 3
      const h = window.innerHeight * 3
      if (!w || !h) { raf = requestAnimationFrame(loop); return }

      const sY = window.scrollY * 0.35
      const bx = pointer.current.x
      const by = pointer.current.y - sY

      const tx = `translate3d(${((bx % w) + w) % w - w}px, ${((by % h) + h) % h - h}px, 0)`
      if (layerA.current) layerA.current.style.transform = tx
      if (layerB.current) layerB.current.style.transform = tx

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!state) return null

  const { grid, w, h } = state
  if (!grid.length) return null

  const totalW = w * 2
  const totalH = h * 2

  const renderCells = (kp: string) =>
    grid.map((c, i) => (
      <span key={`${kp}-${i}`}
        className={c.isSymbol
          ? 'font-playfair text-6xl font-bold text-foreground/10'
          : 'font-playfair italic text-3xl font-bold text-foreground/10'}
        style={{ position: 'absolute', left: c.x, top: c.y, transform: `translate(-50%,-50%) rotate(${c.rotate}deg)`, whiteSpace: 'nowrap' }}
      >{c.text}</span>
    ))

  return (
    <>
      <div className="fixed inset-0 overflow-hidden z-[-2] pointer-events-none">
        <div ref={layerA} className="absolute will-change-transform" style={{ width: totalW, height: totalH, left: 0, top: 0 }}>
          {renderCells('a')}
        </div>
        <div ref={layerB} className="absolute will-change-transform" style={{ width: totalW, height: totalH, left: -w, top: -h }}>
          {renderCells('b')}
        </div>
      </div>
      <div className="fixed inset-0 bg-background/90 z-[-1] pointer-events-none" />
    </>
  )
}
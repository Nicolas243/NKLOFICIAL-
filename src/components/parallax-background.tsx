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

interface Cell {
  x: number; y: number; rotate: number; text: string; isSymbol: boolean
}

function sh<T>(a: readonly T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

function buildGrid(): Cell[] {
  const W = window.innerWidth * 4
  const H = window.innerHeight * 4
  const cw = 320; const ch = 100
  const cols = Math.ceil(W / cw) + 3; const rows = Math.ceil(H / ch) + 2
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
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [grid] = useState<Cell[]>(() => (typeof window !== 'undefined' ? buildGrid() : []))
  const layerRef = useRef<HTMLDivElement>(null)
  const mx = useRef(0)

  const onMove = useCallback((e: MouseEvent) => {
    mx.current = (e.clientX - window.innerWidth / 2) * 0.4
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [onMove])

  // rAF loop — modular wrapping para movimento infinito sem bordas visiveis
  useEffect(() => {
    let raf = 0
    const cw = 320; const ch = 100
    const loop = () => {
      // Wrap via modulo no espaco de uma celula — nunca bate em limite
      const ox = ((mx.current % cw) + cw) % cw
      const oy = ((-window.scrollY * 1.55 % ch) + ch) % ch
      if (layerRef.current) {
        layerRef.current.style.transform = `translate(${ox}px, ${oy}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!mounted || !grid.length) return null

  const totalW = window.innerWidth * 4 + 320 * 3
  const totalH = window.innerHeight * 4 + 100 * 2

  return (
    <>
      {/* Fundo nitido sem blur — overlay escuro para legibilidade do conteudo frontal */}
      <div className="fixed inset-0 overflow-hidden z-[-2] pointer-events-none">
        <div ref={layerRef} className="absolute" style={{ width: totalW, height: totalH, left: -320, top: -100 }}>
          {grid.map((c, i) => (
            <span key={`p-${i}`}
              className={c.isSymbol
                ? 'font-playfair text-3xl font-bold text-text/15'
                : 'font-playfair italic text-3xl font-bold text-text/20'}
              style={{ position: 'absolute', left: c.x, top: c.y, transform: `translate(-50%,-50%) rotate(${c.rotate}deg)`, whiteSpace: 'nowrap' }}
            >{c.text}</span>
          ))}
        </div>
      </div>
      {/* Overlay escuro sem blur — fundo nitido mas texto frontal legivel */}
      <div className="fixed inset-0 bg-background/85 z-[-1] pointer-events-none" />
    </>
  )
}
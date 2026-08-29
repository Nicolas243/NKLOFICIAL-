'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'

export function CurtainIntro() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [stage, setStage] = useState<'closed' | 'logo' | 'open'>('closed')
  const [fallback, setFallback] = useState(false)
  const lRef = useRef<HTMLDivElement>(null)
  const rRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mounted) return
    const t0 = setTimeout(() => setStage('logo'), 0)
    const t1 = setTimeout(() => setStage('open'), 800)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [mounted])

  useEffect(() => {
    if (stage !== 'open') return
    if (lRef.current) lRef.current.style.transform = 'scaleX(0)'
    if (rRef.current) rRef.current.style.transform = 'scaleX(0)'
  }, [stage])

  // SSR skeleton: cortina fechada que bloqueia FOUC
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background">
        <div className="absolute top-0 w-[50vw] h-full bg-surface z-[99998] origin-left" style={{ left: 0 }} />
        <div className="absolute top-0 w-[50vw] h-full bg-surface z-[99998] origin-right" style={{ right: 0 }} />
      </div>
    )
  }

  // Apos animacao, desmonta totalmente
  if (stage === 'open') return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background">
      <div ref={lRef}
        className="absolute top-0 w-[50vw] h-full bg-surface z-[99998] origin-left"
        style={{ left: 0, transition: 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)' }}
      />
      <div ref={rRef}
        className="absolute top-0 w-[50vw] h-full bg-surface z-[99998] origin-right"
        style={{ right: 0, transition: 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)' }}
      />
      <div className={`absolute inset-0 flex items-center justify-center z-[100000] transition-opacity duration-500 ${stage === 'logo' ? 'opacity-100' : 'opacity-0'}`}>
        <Image
          src={fallback ? '/NKL/NKL.png' : '/NKL/logo-violino.png'}
          alt="NKL"
          width={80} height={80}
          unoptimized
          priority
          className={stage === 'logo' ? 'animate-[dotPopIn_0.8s_forwards_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}
          onError={() => setFallback(true)}
        />
      </div>
    </div>
  )
}
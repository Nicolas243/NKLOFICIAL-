'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export function CurtainIntro() {
  const [isVisible, setIsVisible] = useState(true)
  const [stage, setStage] = useState<'logo' | 'open'>('logo')
  const [fallback, setFallback] = useState(false)
  const lRef = useRef<HTMLDivElement>(null)
  const rRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)

  // Timeline: 0ms logo pop-in → 800ms abre cortinas → 2500ms desmonta
  useEffect(() => {
    const t1 = setTimeout(() => setStage('open'), 800)
    const t2 = setTimeout(() => setIsVisible(false), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Aciona translate manualmente nos refs quando o stage muda
  useEffect(() => {
    if (stage === 'open') {
      if (lRef.current) lRef.current.style.transform = 'scaleX(0)'
      if (rRef.current) rRef.current.style.transform = 'scaleX(0)'
      if (bgRef.current) bgRef.current.classList.add('anim-bg-fade')
    }
  }, [stage])

  if (!isVisible) return null

  return (
    <div ref={bgRef} className="fixed inset-0 z-[99999] flex items-center justify-center bg-background">
      {/* Cortina esquerda */}
      <div ref={lRef}
        className="absolute top-0 w-[50vw] h-full bg-surface z-[99998] origin-left"
        style={{ left: 0, transition: 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)' }}
      />
      {/* Cortina direita */}
      <div ref={rRef}
        className="absolute top-0 w-[50vw] h-full bg-surface z-[99998] origin-right"
        style={{ right: 0, transition: 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)' }}
      />
      {/* Logo central */}
      <div className={`absolute inset-0 flex items-center justify-center z-[100000] transition-opacity duration-500 ${stage === 'open' ? 'opacity-0' : 'opacity-100'}`}>
        <Image
          src={fallback ? '/NKL/NKL.png' : '/NKL/logo-violino.png'}
          alt="NKL"
          width={80} height={80}
          unoptimized
          className={stage === 'logo' ? 'animate-[dotPopIn_0.8s_forwards_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}
          onError={() => setFallback(true)}
        />
      </div>
    </div>
  )
}
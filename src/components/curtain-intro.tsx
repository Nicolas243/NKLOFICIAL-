'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export function CurtainIntro() {
  const [mounted, setMounted] = useState(false)
  const [stage, setStage] = useState<'closed' | 'logo' | 'opening' | 'done'>('closed')
  const [fallback, setFallback] = useState(false)
  const lRef = useRef<HTMLDivElement>(null)
  const rRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const t0 = setTimeout(() => setStage('logo'), 100)
    const t1 = setTimeout(() => setStage('opening'), 900)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [mounted])

  const onLeftEnd = () => { if (stage === 'opening') lRef.current!.style.display = 'none' }
  const onRightEnd = () => { if (stage === 'opening') { rRef.current!.style.display = 'none'; setStage('done') } }

  if (!mounted || stage === 'closed') {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center w-screen h-screen overflow-hidden bg-background">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-background z-[100000]" />
        <div className="absolute top-0 left-0 w-1 h-full bg-foreground z-[100001]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-background z-[100000]" />
        <div className="absolute top-0 right-0 w-1 h-full bg-foreground z-[100001]" />
      </div>
    )
  }

  if (stage === 'done') return null

  const isOpening = stage === 'opening'
  const lTransform = isOpening ? 'translateX(-100%)' : 'translateX(0)'
  const rTransform = isOpening ? 'translateX(100%)' : 'translateX(0)'

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center w-screen h-screen overflow-hidden bg-background">
      {/* Cortina esquerda */}
      <div ref={lRef}
        onTransitionEnd={onLeftEnd}
        className="absolute top-0 left-0 w-1/2 h-full bg-background z-[100000]"
        style={{ transform: lTransform, transition: 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)' }}
      >
        <div className="absolute top-0 right-0 w-1 h-full bg-foreground" />
      </div>

      {/* Cortina direita */}
      <div ref={rRef}
        onTransitionEnd={onRightEnd}
        className="absolute top-0 right-0 w-1/2 h-full bg-background z-[100000]"
        style={{ transform: rTransform, transition: 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)' }}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-foreground" />
      </div>

      {/* Logo central */}
      <div className={`absolute inset-0 flex items-center justify-center z-[100002] transition-opacity duration-500 ${isOpening ? 'opacity-0' : 'opacity-100'}`}>
        <Image
          src={fallback ? '/NKL/NKL.png' : '/NKL/logo-violino.png'}
          alt="NKL" width={80} height={80} unoptimized priority
          className={stage === 'logo' ? 'animate-[dotPopIn_0.8s_forwards_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}
          onError={() => setFallback(true)}
        />
      </div>
    </div>
  )
}
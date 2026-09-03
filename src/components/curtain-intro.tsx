'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

export function CurtainIntro() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const [stage, setStage] = useState<'closed' | 'logo' | 'opening' | 'done'>('closed')
  const [fallback, setFallback] = useState(false)
  const lRef = useRef<HTMLDivElement>(null)
  const rRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mounted) return
    const t0 = setTimeout(() => setStage('logo'), 50)
    const t1 = setTimeout(() => setStage('opening'), 850)
    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
    }
  }, [mounted])

  const onLeftEnd = () => {
    if (stage === 'opening' && lRef.current) {
      lRef.current.style.display = 'none'
    }
  }

  const onRightEnd = () => {
    if (stage === 'opening' && rRef.current) {
      rRef.current.style.display = 'none'
      setStage('done')
    }
  }

  if (!mounted || stage === 'done') return null

  const isOpening = stage === 'opening'
  const isLogo = stage === 'logo' || stage === 'opening'
  const lTransform = isOpening ? 'translateX(-105%)' : 'translateX(0)'
  const rTransform = isOpening ? 'translateX(105%)' : 'translateX(0)'

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden w-screen h-screen">
      {/* Cortina esquerda: retângulo gigante que excede a tela (60vw x 140vh) */}
      <div
        ref={lRef}
        onTransitionEnd={onLeftEnd}
        className="absolute -top-[20vh] left-0 h-[140vh] w-[55vw] bg-neutral-300 dark:bg-neutral-800 pointer-events-auto z-[100000]"
        style={{
          transform: lTransform,
          transition: 'transform 1.1s cubic-bezier(0.77, 0, 0.175, 1)',
          willChange: 'transform',
        }}
      >
        {/* Barra de encontro da cortina esquerda */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-foreground opacity-90 shadow-sm" />
      </div>

      {/* Cortina direita: retângulo gigante que excede a tela (60vw x 140vh) */}
      <div
        ref={rRef}
        onTransitionEnd={onRightEnd}
        className="absolute -top-[20vh] right-0 h-[140vh] w-[55vw] bg-neutral-300 dark:bg-neutral-800 pointer-events-auto z-[100000]"
        style={{
          transform: rTransform,
          transition: 'transform 1.1s cubic-bezier(0.77, 0, 0.175, 1)',
          willChange: 'transform',
        }}
      >
        {/* Barra de encontro da cortina direita */}
        <div className="absolute top-0 left-0 w-[2px] h-full bg-foreground opacity-90 shadow-sm" />
      </div>

      {/* Logo central fixo, único e perfeitamente ancorado ao centro */}
      <div className="fixed inset-0 flex items-center justify-center z-[100002] pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallback ? '/NKL/NKL.png' : '/NKL/logo-violino.png'}
          alt="NKL"
          width={88}
          height={88}
          onError={() => setFallback(true)}
          className={`w-[88px] h-[88px] object-contain dark:invert transition-all duration-500 select-none ${
            isLogo
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-50'
          }`}
          style={{
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
type Stage = 'closed' | 'split' | 'bow-entering' | 'turning' | 'release' | 'opening' | 'done'

export function CurtainIntro() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [stage, setStage] = useState<Stage>('closed')

  useEffect(() => {
    if (!mounted) return
    const timers = [
      window.setTimeout(() => setStage('split'), 850),
      window.setTimeout(() => setStage('bow-entering'), 1_250),
      window.setTimeout(() => setStage('turning'), 2_350),
      window.setTimeout(() => setStage('release'), 3_450),
      window.setTimeout(() => setStage('opening'), 3_850),
      window.setTimeout(() => setStage('done'), 5_400),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [mounted])

  if (!mounted || stage === 'done') return null

  const isSplit = stage !== 'closed'
  const isBowEntering = stage === 'bow-entering'
  const isTurning = stage === 'turning'
  const isBowVisible = isBowEntering || isTurning
  const isReleased = stage === 'release' || stage === 'opening'
  const isOpening = stage === 'opening'
  const panelTransition = 'transform 1.45s cubic-bezier(0.76, 0, 0.18, 1)'
  const bowPosition = isBowEntering
    ? 'translate(calc(-50% + 3vw), calc(-50% + 3vw))'
    : stage === 'turning'
      ? 'translate(calc(-50% + 8vw), calc(-50% - 8vw))'
      : 'translate(-50%, calc(-50% + 16vw))'
  const panelTransform = (side: 'left' | 'right') =>
    isOpening ? `translateX(${side === 'left' ? '-108%' : '108%'})` : 'translateX(0)'

  const instrumentStyle = {
    filter: 'var(--curtain-instrument-filter)',
    opacity: isSplit && !isReleased ? 0 : isReleased ? 0 : 1,
    transform: `translate(-50%, -50%) rotate(${isTurning ? '90deg' : '0deg'})`,
    transition: 'transform 1.2s cubic-bezier(0.62, 0, 0.25, 1), opacity 0.55s ease',
  }
  const halfStyle = (side: 'left' | 'right') => ({
    filter: 'var(--curtain-instrument-filter)',
    opacity: isSplit ? 1 : 0,
    transform: `translate(calc(-50% ${isOpening ? side === 'left' ? '- 52vw' : '+ 52vw' : ''}), -50%) rotate(90deg)`,
    transition: isOpening
      ? `${panelTransition}, opacity 0.35s ease`
      : 'transform 0.05s linear, opacity 0.35s ease',
  })

  return (
    <div className="curtain-intro fixed inset-0 z-[99999] h-screen w-screen overflow-hidden pointer-events-none">
      <div className="curtain-panel curtain-panel-left" style={{ transform: panelTransform('left'), transition: panelTransition }}>
        <div className="curtain-bar" />
        <div className="curtain-square" />
      </div>
      <div className="curtain-panel curtain-panel-right" style={{ transform: panelTransform('right'), transition: panelTransition }}>
        <div className="curtain-bar" />
        <div className="curtain-square" />
      </div>

      <div className="curtain-instrument" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/NKL/Violino_chave_logo-transparent.png" alt="" className="curtain-violin" style={instrumentStyle} />
        <div className="curtain-half curtain-half-left" style={halfStyle('left')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/NKL/Violino_chave_logo-transparent.png" alt="" />
        </div>
        <div className="curtain-half curtain-half-right" style={halfStyle('right')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/NKL/Violino_chave_logo-transparent.png" alt="" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/NKL/arco_chave-transparent.png"
          alt=""
          className="curtain-bow"
          style={{
            filter: 'var(--curtain-instrument-filter)',
            opacity: isBowVisible ? 1 : 0,
            transform: `${bowPosition} rotate(${isTurning ? '90deg' : '0deg'})`,
            transition: 'transform 1.2s cubic-bezier(0.62, 0, 0.25, 1), opacity 0.6s ease',
          }}
        />
      </div>

      <style jsx>{`
        .curtain-intro {
          --curtain-panel: #777777;
          --curtain-panel-shadow: rgba(30, 30, 30, 0.32);
          --curtain-line: #bdbdbd;
          --curtain-instrument-filter: none;
          background: transparent;
        }

        :global(.dark) .curtain-intro {
          --curtain-panel: #555555;
          --curtain-panel-shadow: rgba(15, 15, 15, 0.42);
          --curtain-line: #9e9e9e;
          --curtain-instrument-filter: invert(1);
        }

        .curtain-panel {
          position: absolute;
          top: -20vh;
          width: 50vw;
          height: 140vh;
          overflow: hidden;
          background-color: var(--curtain-panel);
          background-image: linear-gradient(160deg, rgba(255,255,255,0.07), transparent 28%, rgba(0,0,0,0.16) 82%), repeating-linear-gradient(0deg, transparent 0 34px, rgba(50,50,50,0.48) 35px 37px), repeating-linear-gradient(90deg, rgba(235,235,235,0.09) 0 1px, transparent 1px 76px);
          box-shadow: inset 0 0 55px var(--curtain-panel-shadow), inset 0 1px 0 rgba(220,220,220,0.16);
          pointer-events: auto;
          will-change: transform;
        }

        .curtain-panel-left { left: 0; }
        .curtain-panel-right { right: 0; }
        .curtain-bar {
          position: absolute;
          top: 0;
          width: 4px;
          height: 100%;
          background: var(--curtain-line);
          box-shadow: 0 0 5px rgba(0,0,0,0.25);
        }
        .curtain-panel-left .curtain-bar { right: 0; }
        .curtain-panel-right .curtain-bar { left: 0; }
        .curtain-square {
          position: absolute;
          top: 50%;
          width: clamp(28px, 4vw, 58px);
          aspect-ratio: 1;
          border: 4px solid var(--curtain-line);
          background: var(--curtain-panel);
          transform: translateY(-50%);
          box-shadow: 0 0 7px rgba(0,0,0,0.26);
        }
        .curtain-panel-left .curtain-square { right: clamp(-29px, -2vw, -14px); }
        .curtain-panel-right .curtain-square { left: clamp(-29px, -2vw, -14px); }
        .curtain-instrument {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }
        .curtain-violin, .curtain-bow, .curtain-half {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(21vw, 21vh, 125px);
          height: auto;
          transform-origin: center;
          object-fit: contain;
          will-change: transform, opacity;
        }
        .curtain-bow { width: min(24vw, 24vh, 145px); z-index: 2; }
        .curtain-violin { z-index: 1; }
        .curtain-half {
          z-index: 1;
          overflow: hidden;
          width: min(21vw, 21vh, 125px);
          height: min(21vw, 21vh, 125px);
        }
        .curtain-half img { width: 100%; height: 100%; object-fit: contain; }
        .curtain-half-left { clip-path: inset(0 50% 0 0); }
        .curtain-half-right { clip-path: inset(0 0 0 50%); z-index: 3; }
      `}</style>
    </div>
  )
}
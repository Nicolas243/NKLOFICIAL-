'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isIncomePortalPath } from '@/lib/income-portal';

const PARALLAX_SPEEDS = [-0.08, -0.18, -0.28] as const;

export function ParallaxBackground() {
  const pathname = usePathname();
  const layers = useRef<Array<HTMLDivElement | null>>([]);
  const isPartnerPortal = isIncomePortalPath(pathname);

  useEffect(() => {
    if (!isPartnerPortal) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame: number | undefined;

    const updateLayers = (): void => {
      frame = undefined;
      const scrollY = window.scrollY;
      layers.current.forEach((layer, index) => {
        if (layer) {
          layer.style.transform = reducedMotion
            ? 'translate3d(0, 0, 0)'
            : `translate3d(0, ${scrollY * PARALLAX_SPEEDS[index]}px, 0)`;
        }
      });
    };

    const handleScroll = (): void => {
      if (frame === undefined) {
        frame = window.requestAnimationFrame(updateLayers);
      }
    };

    updateLayers();
    if (reducedMotion) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [isPartnerPortal]);

  if (!isPartnerPortal) {
    return (
      <div className="music-parallax-field fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="music-parallax-notes" />
        <div className="music-parallax-staves" />
        <div className="music-parallax-particles" />
        <div className="fixed inset-0 bg-background/70" />
        <div className="site-texture site-texture-music fixed inset-0" />
      </div>
    );
  }

  return (
    <div className="income-parallax-field fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        ref={(layer) => {
          layers.current[0] = layer;
        }}
        className="income-parallax-layer income-parallax-dots"
      />
      <div
        ref={(layer) => {
          layers.current[1] = layer;
        }}
        className="income-parallax-layer income-parallax-glow"
      >
        <span className="income-parallax-glow-orange" />
        <span className="income-parallax-glow-cool" />
      </div>
      <div
        ref={(layer) => {
          layers.current[2] = layer;
        }}
        className="income-parallax-layer income-parallax-particles"
      />
    </div>
  );
}

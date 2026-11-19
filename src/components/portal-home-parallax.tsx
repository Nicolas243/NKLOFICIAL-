'use client';

import { useEffect, useRef } from 'react';

const PARALLAX_SPEEDS = [-0.04, -0.09, -0.14] as const;

export function PortalHomeParallax() {
  const layers = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileMedia = window.matchMedia('(max-width: 767px)');
    let frame: number | undefined;

    const clearTransforms = (): void => {
      layers.current.forEach((layer) => {
        if (layer) {
          layer.style.transform = '';
        }
      });
    };

    const updateLayers = (): void => {
      frame = undefined;
      if (motionMedia.matches || mobileMedia.matches) {
        clearTransforms();
        return;
      }
      const scrollY = window.scrollY;
      if (scrollY <= 0) {
        clearTransforms();
        return;
      }
      layers.current.forEach((layer, index) => {
        if (layer) {
          const offset = Math.round(scrollY * PARALLAX_SPEEDS[index] * 100) / 100;
          layer.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      });
    };

    const handleScroll = (): void => {
      if (motionMedia.matches || mobileMedia.matches) return;
      if (frame === undefined) {
        frame = window.requestAnimationFrame(updateLayers);
      }
    };

    const handleMediaChange = (): void => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
        frame = undefined;
      }
      updateLayers();
    };

    updateLayers();
    window.addEventListener('scroll', handleScroll, { passive: true });
    motionMedia.addEventListener('change', handleMediaChange);
    mobileMedia.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      motionMedia.removeEventListener('change', handleMediaChange);
      mobileMedia.removeEventListener('change', handleMediaChange);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="portal-parallax" aria-hidden="true" data-testid="portal-home-parallax">
      <div
        ref={(layer) => {
          layers.current[0] = layer;
        }}
        className="portal-parallax-layer portal-parallax-grid"
      />
      <div
        ref={(layer) => {
          layers.current[1] = layer;
        }}
        className="portal-parallax-layer portal-parallax-glow"
      >
        <span className="portal-parallax-orb portal-parallax-orb-amber" />
        <span className="portal-parallax-orb portal-parallax-orb-petrol" />
      </div>
      <div
        ref={(layer) => {
          layers.current[2] = layer;
        }}
        className="portal-parallax-layer portal-parallax-dots"
      />
    </div>
  );
}

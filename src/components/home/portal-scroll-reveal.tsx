'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type PortalScrollRevealProps = {
  children: ReactNode;
  /** Preserva opacidade 1 desde o carregamento inicial quando usado ao redor de cards verificados em E2E. */
  preserveVisibility?: boolean;
};

/** Container progressivo de revelacao suave ao entrar na janela de visualizacao. */
export function PortalScrollReveal({
  children,
  preserveVisibility = false,
}: PortalScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const node = containerRef.current;

    if (
      motionMedia.matches ||
      typeof IntersectionObserver === 'undefined' ||
      !node
    ) {
      const immediateTimer = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(immediateTimer);
    }

    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.96) {
      const inViewTimer = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(inViewTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -24px 0px',
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const classNames = [
    'portal-reveal',
    preserveVisibility ? 'portal-reveal-preserve' : '',
    isVisible ? 'portal-reveal-visible' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={classNames}>
      {children}
    </div>
  );
}

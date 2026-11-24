'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PortalFluidToggle } from '@/components/home/portal-fluid-toggle';
import { PortalThemeToggle } from '@/components/home/portal-theme-toggle';
import { useSessionUser } from '@/components/use-session-user';

type WayfindingSectionId = 'topo' | 'trilhas' | 'principais' | 'catalogo';

const WAYFINDING_ITEMS: readonly { id: WayfindingSectionId; label: string }[] = [
  { id: 'topo', label: 'Início' },
  { id: 'trilhas', label: 'Escolher trilha' },
  { id: 'principais', label: 'Principais áreas' },
  { id: 'catalogo', label: 'Guias e idiomas' },
];

const SECTION_IDS: readonly WayfindingSectionId[] = ['topo', 'trilhas', 'principais', 'catalogo'];

/** Barra superior fixa da pagina inicial com navegacao por secoes e indicador de leitura. */
export function PortalWayfindingBar() {
  const { user, loading: sessionLoading } = useSessionUser();
  const [activeSection, setActiveSection] = useState<WayfindingSectionId>('topo');
  const progressFillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId: number | undefined;

    const updateProgress = (): void => {
      rafId = undefined;
      const fill = progressFillRef.current;
      if (!fill) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      fill.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    const scheduleProgressUpdate = (): void => {
      if (rafId !== undefined) return;
      rafId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true });
    window.addEventListener('resize', scheduleProgressUpdate, { passive: true });

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', scheduleProgressUpdate);
      window.removeEventListener('resize', scheduleProgressUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const ratios = new Map<WayfindingSectionId, number>();

    const pickActiveSection = (): void => {
      let bestId: WayfindingSectionId | null = null;
      let bestRatio = 0;

      for (const id of SECTION_IDS) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }

      if (bestId) {
        setActiveSection(bestId);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as WayfindingSectionId;
          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        pickActiveSection();
      },
      {
        rootMargin: '-20% 0px -45% 0px',
        threshold: [0, 0.15, 0.35, 0.6],
      },
    );

    const observeSections = (): void => {
      observer.disconnect();
      ratios.clear();
      for (const id of SECTION_IDS) {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      }
    };

    observeSections();

    const areasRoot = document.getElementById('areas');
    const mutationObserver = areasRoot
      ? new MutationObserver(() => {
          observeSections();
        })
      : null;

    if (areasRoot && mutationObserver) {
      mutationObserver.observe(areasRoot, { childList: true, subtree: true });
    }

    return () => {
      mutationObserver?.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <div className="portal-topbar" aria-label="Identidade e acesso do Portal NKL">
      <div className="portal-brand">
        <Image
          src="/NKL/NKL.png"
          alt="Portal NKL"
          width={34}
          height={34}
          className="portal-brand-logo"
        />
        <div className="portal-brand-copy">
          <span className="portal-brand-name">Portal NKL</span>
          <span className="portal-brand-tag">
            <span className="portal-live-dot" aria-hidden="true" />
            Tudo o que você precisa em um só lugar
          </span>
        </div>
      </div>

      <nav aria-label="Navegação rápida da página" className="portal-wayfinding-nav">
        {WAYFINDING_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={() => setActiveSection(item.id)}
              className={
                isActive
                  ? 'portal-wayfinding-link portal-wayfinding-link-active'
                  : 'portal-wayfinding-link'
              }
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="portal-utility" aria-label="Utilidades da conta e tema">
        <PortalFluidToggle />
        <PortalThemeToggle />
        {!sessionLoading && user ? (
          <Link href="/minha-conta" className="portal-utility-link">
            Minha conta
          </Link>
        ) : (
          <Link href="/login" className="portal-utility-link">
            Entrar
          </Link>
        )}
      </div>

      <div className="portal-scroll-progress-track" aria-hidden="true">
        <div ref={progressFillRef} className="portal-scroll-progress-fill" />
      </div>
    </div>
  );
}

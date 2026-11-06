'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type TutorialStep = {
  targetId: string;
  title: string;
  description: string;
};

type Props = {
  steps?: TutorialStep[];
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
const OPEN_EVENT = 'nkl:open-onboarding';
const CARD_GAP = 16;
const VIEWPORT_PADDING = 16;
const INITIAL_DELAY_MS = 900;

const DEFAULT_STEPS: TutorialStep[] = [
  {
    targetId: 'onboarding-filters',
    title: 'Filtre o catálogo',
    description: 'Pesquise por nome, categoria ou dificuldade para encontrar opções que façam sentido para você.',
  },
  {
    targetId: 'onboarding-community-rating',
    title: 'Leia a nota da comunidade',
    description: 'A nota editorial mostra o contexto do portal; as avaliações da comunidade ajudam a enxergar experiências diferentes.',
  },
  {
    targetId: 'onboarding-save',
    title: 'Salve para comparar depois',
    description: 'Use Salvar para montar uma lista curta e voltar às oportunidades quando tiver tempo.',
  },
];

export function OnboardingTutorial({ steps = DEFAULT_STEPS }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const isPartnerPortal = useMemo(
    () => pathname === '/programas' || pathname.startsWith('/programas/') || pathname === '/blog/renda-extra',
    [pathname],
  );

  useEffect(() => {
    if (!isPartnerPortal) return;

    const openFromEvent = () => {
      setStepIndex(0);
      setIsOpen(true);
    };
    document.addEventListener(OPEN_EVENT, openFromEvent);

    const initialTimer = window.setTimeout(() => {
      if (!window.localStorage.getItem(TUTORIAL_COMPLETED_KEY) && document.getElementById(steps[0]?.targetId ?? '')) {
        setIsOpen(true);
      }
    }, INITIAL_DELAY_MS);

    return () => {
      window.clearTimeout(initialTimer);
      document.removeEventListener(OPEN_EVENT, openFromEvent);
    };
  }, [isPartnerPortal, steps]);

  useEffect(() => {
    if (!isOpen) return;

    function updateSpotlight(): void {
      const target = document.getElementById(steps[stepIndex]?.targetId ?? '');
      if (!target) {
        setSpotlight(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      setSpotlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, { passive: true });
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [isOpen, stepIndex, steps]);

  useEffect(() => {
    if (!isOpen) return;
    function closeWithEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') completeTutorial();
    }
    document.addEventListener('keydown', closeWithEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeWithEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function completeTutorial(): void {
    window.localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setIsOpen(false);
    setSpotlight(null);
  }

  function nextStep(): void {
    if (stepIndex >= steps.length - 1) {
      completeTutorial();
      return;
    }
    setStepIndex((index) => index + 1);
  }

  if (!isOpen || !spotlight || !steps[stepIndex]) return null;

  const step = steps[stepIndex];
  const cardWidth = Math.min(360, window.innerWidth - VIEWPORT_PADDING * 2);
  const cardLeft = Math.min(Math.max(spotlight.left, VIEWPORT_PADDING), window.innerWidth - cardWidth - VIEWPORT_PADDING);
  const cardTop = spotlight.top + spotlight.height + CARD_GAP > window.innerHeight - 230
    ? Math.max(VIEWPORT_PADDING, spotlight.top - 230 - CARD_GAP)
    : spotlight.top + spotlight.height + CARD_GAP;

  return (
    <div className="fixed inset-0 z-[310] bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-tutorial-title">
      <div
        className="pointer-events-none fixed rounded-xl border-2 border-orange bg-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.68)]"
        style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        aria-hidden="true"
      />
      <section className="fixed rounded-2xl border border-orange/40 bg-surface p-5 text-foreground shadow-2xl" style={{ top: cardTop, left: cardLeft, width: cardWidth }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Guia rápido · {stepIndex + 1}/{steps.length}</p>
        <h2 id="onboarding-tutorial-title" className="mt-2 text-xl font-bold">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{step.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={completeTutorial} className="min-h-11 px-2 text-sm font-bold text-foreground/60 underline hover:text-foreground">Não mostrar novamente</button>
          <button type="button" onClick={nextStep} className="min-h-11 rounded-md bg-orange px-5 py-3 text-sm font-bold text-white hover:bg-orange-dark">{stepIndex === steps.length - 1 ? 'Entendi' : 'Próximo'}</button>
        </div>
      </section>
    </div>
  );
}

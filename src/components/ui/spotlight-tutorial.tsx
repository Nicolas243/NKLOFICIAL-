'use client';

import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { isIncomeCatalogPath } from '@/lib/income-portal';
import { useEffect, useState } from 'react';

type TutorialStep = {
  targetSelector: string;
  title: string;
  description: string;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type Viewport = {
  width: number;
  height: number;
};

const TUTORIAL_SEEN_KEY = 'nkl_tutorial_seen';
const OPEN_EVENT = 'nkl:open-onboarding';
const CARD_GAP = 16;
const VIEWPORT_PADDING = 16;
const INITIAL_DELAY_MS = 900;
const TARGET_RETRY_MS = 120;
const TOOLTIP_HEIGHT_ESTIMATE = 230;

const DEFAULT_STEPS: TutorialStep[] = [
  {
    targetSelector: '#search-input',
    title: 'Pesquise por uma oportunidade',
    description: 'Digite o nome de uma plataforma, categoria ou tag para reduzir o catálogo ao que interessa.',
  },
  {
    targetSelector: '#category-filters',
    title: 'Refine por categoria',
    description: 'Use o filtro de categoria para comparar caminhos parecidos sem misturar perfis muito diferentes.',
  },
  {
    targetSelector: '#income-wizard-trigger',
    title: 'Descubra seu perfil ideal',
    description: 'Responda às perguntas do guia para receber uma seleção inicial de oportunidades alinhadas ao seu momento.',
  },
  {
    targetSelector: '.community-rating',
    title: 'Leia a nota da comunidade',
    description: 'A nota mostra o contexto disponível no portal; abra o cartão para conferir as avaliações e os limites da informação.',
  },
  {
    targetSelector: '#news-suggest',
    title: 'Ajude a atualizar o mapa',
    description: 'Sugira uma plataforma ou uma informação nova para a comunidade avaliar e acompanhar.',
  },
  {
    targetSelector: '#footer-lead',
    title: 'Receba o resumo por e-mail',
    description: 'Cadastre seu contato para receber o Guia gratuito com critérios práticos antes de se cadastrar.',
  },
  {
    targetSelector: '#filtros',
    title: 'Filtre o catálogo',
    description: 'Pesquise por nome, categoria ou dificuldade para encontrar opções que façam sentido para você.',
  },
];

export function SpotlightTutorial({ steps = DEFAULT_STEPS }: { steps?: TutorialStep[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const isPartnerPortal = isIncomeCatalogPath(pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isPartnerPortal) return;

    function openTutorial(): void {
      setStepIndex(0);
      setIsOpen(true);
    }

    document.addEventListener(OPEN_EVENT, openTutorial);
    const timer = window.setTimeout(() => {
      if (!window.localStorage.getItem(TUTORIAL_SEEN_KEY) && document.querySelector(steps[0]?.targetSelector ?? '')) {
        openTutorial();
      }
    }, INITIAL_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener(OPEN_EVENT, openTutorial);
    };
  }, [isPartnerPortal, steps]);

  useEffect(() => {
    if (!isOpen) return;

    let retryTimer: number | undefined;
    let frame: number | undefined;

    function updateSpotlight(): void {
      const target = document.querySelector(steps[stepIndex]?.targetSelector ?? '');
      if (!target) {
        setSpotlight(null);
        retryTimer = window.setTimeout(updateSpotlight, TARGET_RETRY_MS);
        return;
      }

      const rect = target.getBoundingClientRect();
      const isOutsideViewport = rect.top < VIEWPORT_PADDING || rect.bottom > window.innerHeight - VIEWPORT_PADDING;
      if (isOutsideViewport) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        frame = window.requestAnimationFrame(() => updateSpotlight());
        return;
      }

      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setSpotlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, { passive: true });

    return () => {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeWithEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function completeTutorial(): void {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
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

  if (!isMounted || !isOpen || !spotlight || !viewport || !steps[stepIndex]) return null;

  const step = steps[stepIndex];
  const cardWidth = Math.min(360, viewport.width - VIEWPORT_PADDING * 2);
  const cardLeft = Math.min(
    Math.max(spotlight.left, VIEWPORT_PADDING),
    viewport.width - cardWidth - VIEWPORT_PADDING,
  );
  const cardTop = spotlight.top + spotlight.height + CARD_GAP > viewport.height - TOOLTIP_HEIGHT_ESTIMATE
    ? Math.max(VIEWPORT_PADDING, spotlight.top - TOOLTIP_HEIGHT_ESTIMATE - CARD_GAP)
    : spotlight.top + spotlight.height + CARD_GAP;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[310]" role="dialog" aria-modal="true" aria-labelledby="spotlight-tutorial-title">
      <div
        className="pointer-events-auto fixed left-0 top-0 w-full bg-black/70 backdrop-blur-md transition-all duration-300"
        style={{ height: Math.max(0, spotlight.top) }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-auto fixed right-0 bg-black/70 backdrop-blur-md transition-all duration-300"
        style={{ top: spotlight.top, width: Math.max(0, viewport.width - spotlight.left - spotlight.width), height: spotlight.height }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-auto fixed bottom-0 left-0 w-full bg-black/70 backdrop-blur-md transition-all duration-300"
        style={{ top: spotlight.top + spotlight.height, height: Math.max(0, viewport.height - spotlight.top - spotlight.height) }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-auto fixed left-0 bg-black/70 backdrop-blur-md transition-all duration-300"
        style={{ top: spotlight.top, width: Math.max(0, spotlight.left), height: spotlight.height }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed rounded-xl border-2 border-orange bg-transparent transition-all duration-300"
        style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        aria-hidden="true"
      />
      <section className="pointer-events-auto fixed rounded-2xl border border-orange/40 bg-surface p-5 text-foreground shadow-2xl transition-all duration-300" style={{ top: cardTop, left: cardLeft, width: cardWidth }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Guia rápido · {stepIndex + 1}/{steps.length}</p>
        <h2 id="spotlight-tutorial-title" className="mt-2 text-xl font-bold">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{step.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={completeTutorial} className="min-h-11 px-2 text-sm font-bold text-foreground/60 underline hover:text-foreground">Pular tutorial</button>
          <button type="button" onClick={nextStep} className="min-h-11 rounded-md bg-orange px-5 py-3 text-sm font-bold text-white hover:bg-orange-dark">{stepIndex === steps.length - 1 ? 'Entendi' : 'Entendi (Próximo)'}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

'use client';

import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isIncomeCatalogPath } from '@/lib/income-portal';

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
const SCROLL_SETTLE_MS = 350;
const TOOLTIP_HEIGHT_ESTIMATE = 230;

const DEFAULT_STEPS: TutorialStep[] = [
  {
    targetSelector: '#income-wizard-trigger',
    title: 'Descubra seu perfil ideal',
    description: 'Responda às perguntas do guia para receber uma seleção inicial de oportunidades alinhadas ao seu momento.',
  },
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
    targetSelector: '[data-tutorial="program-card-0"]',
    title: 'Conheça um cartão real',
    description: 'Abra o primeiro cartão para conferir nota, potencial, requisitos e os próximos passos da oportunidade.',
  },
  {
    targetSelector: '[data-tutorial="program-rating"]',
    title: 'Leia a nota da comunidade',
    description: 'A nota mostra o contexto disponível no portal; abra o cartão para conferir as avaliações e os limites da informação.',
  },
  {
    targetSelector: '#programs-grid',
    title: 'Compare as oportunidades',
    description: 'Aqui você encontra os cartões do catálogo. Abra uma oportunidade para conferir nota, potencial e próximos passos.',
  },
];

function getVisibleSteps(steps: TutorialStep[]): TutorialStep[] {
  return steps.filter((step) => {
    const target = document.querySelector(step.targetSelector);
    if (!target) return false;
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

export function SpotlightTutorial({ steps = DEFAULT_STEPS }: { steps?: TutorialStep[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState<TutorialStep[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [mounted, setMounted] = useState(false);

  const isPartnerPortal = isIncomeCatalogPath(pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isPartnerPortal) return;

    function openTutorial(): void {
      const availableSteps = getVisibleSteps(steps);
      if (availableSteps.length === 0) return;
      setActiveSteps(availableSteps);
      setStepIndex(0);
      setSpotlight(null);
      setIsOpen(true);
    }

    document.addEventListener(OPEN_EVENT, openTutorial);
    const timer = window.setTimeout(() => {
      if (!window.localStorage.getItem(TUTORIAL_SEEN_KEY)) {
        openTutorial();
      }
    }, INITIAL_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener(OPEN_EVENT, openTutorial);
    };
  }, [isPartnerPortal, steps]);

  useEffect(() => {
    if (!isOpen || activeSteps.length === 0) return;

    let retryTimer: number | undefined;
    let frame: number | undefined;
    let settleTimer: number | undefined;
    let requestedScroll = false;

    function removeInvalidCurrentStep(): void {
      const remainingSteps = getVisibleSteps(activeSteps).filter((step) => step !== activeSteps[stepIndex]);
      if (remainingSteps.length === 0) {
        completeTutorial();
        return;
      }
      setActiveSteps(remainingSteps);
      setStepIndex((index) => Math.min(index, remainingSteps.length - 1));
    }

    function updateSpotlight(): void {
      const currentStep = activeSteps[stepIndex];
      const target = currentStep ? document.querySelector(currentStep.targetSelector) : null;
      if (!target) {
        retryTimer = window.setTimeout(updateSpotlight, TARGET_RETRY_MS);
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        removeInvalidCurrentStep();
        return;
      }

      const isOutsideViewport = rect.top < VIEWPORT_PADDING || rect.bottom > window.innerHeight - VIEWPORT_PADDING;
      if (isOutsideViewport && !requestedScroll) {
        requestedScroll = true;
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        settleTimer = window.setTimeout(updateSpotlight, SCROLL_SETTLE_MS);
      }

      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setSpotlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }

    const handleViewportChange = (): void => {
      frame = window.requestAnimationFrame(updateSpotlight);
    };

    updateSpotlight();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, { passive: true });

    return () => {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange);
    };
  }, [activeSteps, isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen || !activeSteps[stepIndex]) return;

    const target = document.querySelector(activeSteps[stepIndex].targetSelector);
    if (!target) return;

    const handleTargetClick = (): void => {
      completeTutorial();
    };

    target.addEventListener('click', handleTargetClick, true);
    return () => target.removeEventListener('click', handleTargetClick, true);
  }, [activeSteps, isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    function closeWithEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') completeTutorial();
    }

    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [isOpen]);

  function completeTutorial(): void {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    setIsOpen(false);
    setActiveSteps([]);
    setSpotlight(null);
  }

  function nextStep(): void {
    if (stepIndex >= activeSteps.length - 1) {
      completeTutorial();
      return;
    }
    setStepIndex((index) => index + 1);
    setSpotlight(null);
  }

  if (!mounted) return null;
  if (!isOpen || !spotlight || !viewport || !activeSteps[stepIndex]) return null;

  const step = activeSteps[stepIndex];
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
      <div className="pointer-events-auto fixed left-0 right-0 top-0 bg-black/70 backdrop-blur-md transition-all duration-300" style={{ height: Math.max(0, spotlight.top) }} aria-hidden="true" />
      <div className="pointer-events-auto fixed right-0 bg-black/70 backdrop-blur-md transition-all duration-300" style={{ top: spotlight.top, left: spotlight.left + spotlight.width, height: spotlight.height }} aria-hidden="true" />
      <div className="pointer-events-auto fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md transition-all duration-300" style={{ top: spotlight.top + spotlight.height }} aria-hidden="true" />
      <div className="pointer-events-auto fixed left-0 bg-black/70 backdrop-blur-md transition-all duration-300" style={{ top: spotlight.top, width: Math.max(0, spotlight.left), height: spotlight.height }} aria-hidden="true" />
      <div className="pointer-events-none fixed rounded-xl border-2 border-orange bg-transparent transition-all duration-300" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} aria-hidden="true" />
      <section className="pointer-events-auto fixed rounded-2xl border border-orange/40 bg-surface p-5 text-foreground shadow-2xl transition-all duration-300" style={{ top: cardTop, left: cardLeft, width: cardWidth }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Guia rápido · {stepIndex + 1}/{activeSteps.length}</p>
        <h2 id="spotlight-tutorial-title" className="mt-2 text-xl font-bold">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{step.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={completeTutorial} className="min-h-11 px-2 text-sm font-bold text-foreground/60 underline hover:text-foreground">Pular tutorial</button>
          <button type="button" onClick={nextStep} className="min-h-11 rounded-md bg-orange px-5 py-3 text-sm font-bold text-white hover:bg-orange-dark">{stepIndex === activeSteps.length - 1 ? 'Entendi' : 'Entendi (Próximo)'}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

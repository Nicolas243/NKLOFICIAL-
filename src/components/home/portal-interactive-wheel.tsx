'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BrainCircuit,
  Languages,
  Music2,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

type WheelPillarId = 'income' | 'music' | 'languages' | 'learning';

type WheelRouteLink = {
  href: string;
  label: string;
};

type WheelPillar = {
  id: WheelPillarId;
  shortLabel: string;
  title: string;
  summary: string;
  rotationDeg: number;
  icon: LucideIcon;
  links: readonly [WheelRouteLink, WheelRouteLink, WheelRouteLink];
};

const WHEEL_PILLARS: readonly WheelPillar[] = [
  {
    id: 'income',
    shortLabel: 'Renda Extra',
    title: 'Renda Extra e Negócios',
    summary:
      'Veja caminhos reais para ganhar dinheiro pela internet de acordo com seu tempo e perfil.',
    rotationDeg: 0,
    icon: WalletCards,
    links: [
      { href: '/programas', label: 'Ver oportunidades' },
      { href: '/quiz-negocios', label: 'Fazer teste de perfil' },
      { href: '/guias/renda-extra', label: 'Abrir Guia Renda Extra' },
    ],
  },
  {
    id: 'music',
    shortLabel: 'NKL Cordas',
    title: 'NKL Cordas — Área Musical',
    summary:
      'Compare cordas, encontre luthiers e tire dúvidas sobre violino, viola, violoncelo e contrabaixo.',
    rotationDeg: 90,
    icon: Music2,
    links: [
      { href: '/musica/naipe_cordas', label: 'Entrar na área musical' },
      { href: '/catalogo', label: 'Comparar cordas' },
      { href: '/luthiers', label: 'Encontrar luthiers' },
    ],
  },
  {
    id: 'languages',
    shortLabel: 'Idiomas',
    title: 'Estudo de Idiomas',
    summary:
      'Comece a estudar inglês hoje com lições práticas e acompanhe os próximos idiomas do portal.',
    rotationDeg: 180,
    icon: Languages,
    links: [
      { href: '/blog/aprender/ingles', label: 'Começar no inglês' },
      { href: '/guias/ingles', label: 'Ver E-book de Inglês' },
      { href: '/guias/ingles/ebook', label: 'Ler amostra grátis' },
    ],
  },
  {
    id: 'learning',
    shortLabel: 'IA na Prática',
    title: 'IA na Prática',
    summary:
      'Use inteligência artificial no trabalho e nos estudos com ferramentas testadas e aulas diretas.',
    rotationDeg: 270,
    icon: BrainCircuit,
    links: [
      { href: '/ia', label: 'Abrir IA na Prática' },
      { href: '/ia/ferramentas', label: 'Ver ferramentas de IA' },
      { href: '/ia/oferta', label: 'Ver Curso IA na Prática' },
    ],
  },
];

/** Roda interativa das quatro frentes do Portal NKL com atalhos diretos. */
export function PortalInteractiveWheel() {
  const [activeId, setActiveId] = useState<WheelPillarId>('income');
  const activePillar =
    WHEEL_PILLARS.find((pillar) => pillar.id === activeId) ?? WHEEL_PILLARS[0];

  return (
    <section
      id="roda"
      className="portal-wheel-section"
      data-testid="portal-interactive-wheel"
      aria-labelledby="portal-wheel-heading"
    >
      <div className="portal-section-heading">
        <div className="portal-section-heading-text">
          <h2 id="portal-wheel-heading" className="portal-section-kicker">
            Mapa interativo
          </h2>
          <p className="portal-section-subtitle">
            Escolha uma área na roda para ver os atalhos certos
          </p>
        </div>
      </div>

      <div className="portal-wheel-layout">
        <div
          className="portal-wheel-stage"
          data-wheel-accent={activePillar.id}
        >
          <svg
            viewBox="0 0 360 360"
            className="portal-wheel-svg"
            aria-hidden="true"
          >
            <circle
              cx="180"
              cy="180"
              r="142"
              fill="none"
              className="portal-wheel-track"
            />
            <circle
              cx="180"
              cy="180"
              r="82"
              fill="none"
              className="portal-wheel-inner-ring"
            />
            <line x1="180" y1="22" x2="180" y2="96" className="portal-wheel-axis" />
            <line x1="180" y1="264" x2="180" y2="338" className="portal-wheel-axis" />
            <line x1="22" y1="180" x2="96" y2="180" className="portal-wheel-axis" />
            <line x1="264" y1="180" x2="338" y2="180" className="portal-wheel-axis" />

            <g
              className="portal-wheel-orbit"
              style={{ transform: `rotate(${activePillar.rotationDeg}deg)` }}
            >
              <path
                d="M 48.2 125.4 A 142 142 0 0 1 125.4 48.2"
                fill="none"
                className="portal-wheel-arc"
              />
              <circle cx="79.6" cy="79.6" r="6.5" className="portal-wheel-node" />
            </g>
          </svg>

          {WHEEL_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = pillar.id === activePillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveId(pillar.id)}
                data-wheel-quadrant={pillar.id}
                className={
                  isActive
                    ? 'portal-wheel-btn portal-wheel-btn-active'
                    : 'portal-wheel-btn'
                }
              >
                <span className="portal-wheel-btn-head">
                  <span className="portal-wheel-btn-icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <span className="portal-wheel-btn-label">{pillar.shortLabel}</span>
                </span>
                <span className="portal-wheel-btn-meta">3 caminhos</span>
              </button>
            );
          })}

          <div className="portal-wheel-center" aria-live="polite">
            <span className="portal-wheel-center-kicker">Área ativa</span>
            <strong className="portal-wheel-center-title">{activePillar.shortLabel}</strong>
            <span className="portal-wheel-center-count">
              {activePillar.links.length} caminhos
            </span>
          </div>
        </div>

        <div
          className="portal-wheel-panel"
          data-wheel-accent={activePillar.id}
        >
          <div className="portal-wheel-panel-head">
            <span className="portal-wheel-panel-eyebrow">{activePillar.shortLabel}</span>
            <h3 className="portal-wheel-panel-title">{activePillar.title}</h3>
            <p className="portal-wheel-panel-summary">{activePillar.summary}</p>
          </div>

          <div className="portal-wheel-links">
            {activePillar.links.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="portal-wheel-link"
              >
                <span>{route.label}</span>
                <ArrowUpRight size={17} className="portal-wheel-link-arrow" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

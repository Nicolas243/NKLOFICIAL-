'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Languages,
  Music2,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  PORTAL_TRACKS,
  type PortalTrack,
  type TrackAccent,
  type TrackId,
} from '@/config/tracks';
import { trackPortalFunnelEvent } from '@/lib/analytics';

const TRACK_ICONS: Record<TrackId, LucideIcon> = {
  'renda-extra': WalletCards,
  musica: Music2,
  'idiomas-ia': Languages,
  'ia-completa': Sparkles,
};

const ACCENT_SURFACE_CLASSES: Record<
  TrackAccent,
  {
    roadmapBorderTop: string;
    badge: string;
    stepBadge: string;
    activeButtonRing: string;
  }
> = {
  income: {
    roadmapBorderTop: 'border-t-4 border-t-[#c2410c] dark:border-t-[#f97316]',
    badge: 'text-[#9a3412] dark:text-[#fb923c]',
    stepBadge:
      'border-[#c2410c]/30 bg-[#c2410c]/10 text-[#9a3412] dark:border-[#f97316]/35 dark:bg-[#f97316]/15 dark:text-[#fdba74]',
    activeButtonRing:
      'border-[#c2410c] ring-2 ring-[#c2410c]/20 dark:border-[#f97316] dark:ring-[#f97316]/25',
  },
  music: {
    roadmapBorderTop: 'border-t-4 border-t-[#1d4ed8] dark:border-t-[#60a5fa]',
    badge: 'text-[#1d4ed8] dark:text-[#60a5fa]',
    stepBadge:
      'border-[#1d4ed8]/30 bg-[#1d4ed8]/10 text-[#1d4ed8] dark:border-[#60a5fa]/35 dark:bg-[#60a5fa]/15 dark:text-[#93c5fd]',
    activeButtonRing:
      'border-[#1d4ed8] ring-2 ring-[#1d4ed8]/20 dark:border-[#60a5fa] dark:ring-[#60a5fa]/25',
  },
  languages: {
    roadmapBorderTop: 'border-t-4 border-t-[#065f46] dark:border-t-[#34d399]',
    badge: 'text-[#065f46] dark:text-[#34d399]',
    stepBadge:
      'border-[#065f46]/30 bg-[#065f46]/10 text-[#065f46] dark:border-[#34d399]/35 dark:bg-[#34d399]/15 dark:text-[#6ee7b7]',
    activeButtonRing:
      'border-[#065f46] ring-2 ring-[#065f46]/20 dark:border-[#34d399] dark:ring-[#34d399]/25',
  },
  learning: {
    roadmapBorderTop: 'border-t-4 border-t-[#4338ca] dark:border-t-[#818cf8]',
    badge: 'text-[#4338ca] dark:text-[#818cf8]',
    stepBadge:
      'border-[#4338ca]/30 bg-[#4338ca]/10 text-[#4338ca] dark:border-[#818cf8]/35 dark:bg-[#818cf8]/15 dark:text-[#a5b4fc]',
    activeButtonRing:
      'border-[#4338ca] ring-2 ring-[#4338ca]/20 dark:border-[#818cf8] dark:ring-[#818cf8]/25',
  },
};

function getInitialTrack(): PortalTrack {
  return PORTAL_TRACKS[0];
}

export function PortalTrackSelector() {
  const [selectedId, setSelectedId] = useState<TrackId>(() => getInitialTrack().id);
  const activeTrack =
    PORTAL_TRACKS.find((track) => track.id === selectedId) ?? PORTAL_TRACKS[0];
  const accentStyle = ACCENT_SURFACE_CLASSES[activeTrack.accent];

  return (
    <section
      id="trilhas"
      className="portal-track-selector flex flex-col gap-5 rounded-[22px] border border-[var(--portal-border,#aebccf)] bg-[var(--portal-surface,rgba(223,230,239,0.86))] p-4 shadow-[var(--portal-shadow)] sm:gap-6 sm:p-6"
      data-testid="portal-track-selector"
      aria-labelledby="portal-track-heading"
    >
      <div className="portal-section-heading">
        <div className="portal-section-heading-text">
          <h2
            id="portal-track-heading"
            className="portal-section-kicker text-[var(--portal-ink,#0b1526)]"
          >
            Qual é o seu objetivo agora?
          </h2>
          <p className="portal-section-subtitle text-[var(--portal-muted,#2a3b52)]">
            Escolha sua trilha e siga um roteiro em 3 passos práticos.
          </p>
        </div>
      </div>

      <div className="portal-track-layout grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)] lg:gap-7">
        <div
          className="portal-track-options grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1"
          role="group"
          aria-label="Objetivos disponíveis no Portal NKL"
        >
          {PORTAL_TRACKS.map((track) => {
            const Icon = TRACK_ICONS[track.id];
            const isSelected = track.id === activeTrack.id;
            const trackAccent = ACCENT_SURFACE_CLASSES[track.accent];

            return (
              <button
                key={track.id}
                type="button"
                aria-pressed={isSelected}
                data-track-id={track.id}
                onClick={() => {
                  setSelectedId(track.id);
                  trackPortalFunnelEvent('track_select', {
                    track_id: track.id,
                    source: 'home_selector',
                  });
                }}
                className={[
                  'portal-track-option flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
                  isSelected
                    ? `portal-track-option-active bg-[var(--portal-surface-featured,rgba(230,236,244,0.92))] ${trackAccent.activeButtonRing}`
                    : 'border-[var(--portal-border,#aebccf)] bg-[var(--portal-surface-elevated,rgba(229,235,243,0.88))] hover:border-[var(--portal-border-strong,#93a5bd)] hover:bg-[var(--portal-surface-hover,#d5dee9)]',
                ].join(' ')}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      'portal-track-option-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      isSelected
                        ? trackAccent.stepBadge
                        : 'bg-[var(--portal-icon-bg,rgba(11,21,38,0.1))] text-[var(--portal-icon-fg,#0f213d)]',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    <Icon size={19} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="portal-track-option-title text-[0.95rem] font-bold leading-snug text-[var(--portal-ink,#0b1526)]">
                      {track.title}
                    </span>
                    <span className="portal-track-option-meta text-xs font-medium text-[var(--portal-muted,#2a3b52)]">
                      3 passos práticos
                    </span>
                  </span>
                </span>

                <span
                  className={[
                    'shrink-0 text-xs font-bold uppercase tracking-wider',
                    isSelected
                      ? trackAccent.badge
                      : 'text-[var(--portal-subtle,#33465e)]',
                  ].join(' ')}
                >
                  {isSelected ? 'Ativa' : 'Ver'}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={[
            'portal-track-roadmap flex min-w-0 flex-col gap-5 rounded-[18px] border border-[var(--portal-border-strong,#93a5bd)] bg-[var(--portal-surface-elevated,rgba(229,235,243,0.92))] p-4 sm:p-6',
            accentStyle.roadmapBorderTop,
          ].join(' ')}
          data-testid="portal-track-roadmap"
          data-track-accent={activeTrack.accent}
          aria-live="polite"
        >
          <div className="portal-track-roadmap-head flex flex-col gap-1.5">
            <span
              className={`portal-track-roadmap-eyebrow text-xs font-bold uppercase tracking-[0.1em] ${accentStyle.badge}`}
            >
              {activeTrack.shortLabel}
            </span>
            <h3 className="portal-track-roadmap-title m-0 text-xl font-bold tracking-tight text-[var(--portal-ink,#0b1526)] sm:text-2xl">
              {activeTrack.title}
            </h3>
            <p className="portal-track-roadmap-summary m-0 text-sm leading-relaxed text-[var(--portal-muted,#2a3b52)] sm:text-[0.95rem]">
              {activeTrack.summary}
            </p>
          </div>

          <ol className="portal-track-steps m-0 grid list-none grid-cols-1 gap-3 p-0">
            {activeTrack.steps.map((step) => (
              <li
                key={step.stepNumber}
                className="portal-track-step flex items-start gap-3.5 rounded-2xl border border-[var(--portal-border,#aebccf)] bg-[var(--portal-surface,rgba(223,230,239,0.86))] p-3.5 sm:p-4"
              >
                <span
                  className={`portal-track-step-number inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums ${accentStyle.stepBadge}`}
                  aria-hidden="true"
                >
                  {step.stepNumber}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span
                    className={`portal-track-step-tag text-xs font-bold uppercase tracking-[0.06em] ${accentStyle.badge}`}
                  >
                    {step.tag}
                  </span>
                  <h4 className="portal-track-step-title m-0 text-base font-bold leading-snug text-[var(--portal-ink,#0b1526)]">
                    {step.title}
                  </h4>
                  <p className="portal-track-step-description m-0 text-sm leading-relaxed text-[var(--portal-muted,#2a3b52)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="portal-track-actions flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/instalar?trilha=${activeTrack.id}`}
              data-testid="portal-track-install-cta"
              className="portal-btn-primary w-full sm:w-auto"
              onClick={() =>
                trackPortalFunnelEvent('install_cta_click', {
                  track_id: activeTrack.id,
                  source: 'home_selector',
                  target: 'instalar',
                })
              }
            >
              <span>Instalar app Portal NKL para esta trilha</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href={activeTrack.freePortalHref}
              className="portal-btn-secondary w-full sm:w-auto"
            >
              <span>Explorar área aberta primeiro</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

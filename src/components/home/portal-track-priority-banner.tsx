'use client';

import Link from 'next/link';
import { ArrowUpRight, Compass, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NKL_SELECTED_TRACK_KEY, type TrackId } from '@/config/app-brand';
import { getTrackById, isValidTrackId } from '@/config/tracks';

const TRACK_UPDATED_EVENT = 'nkl:track-updated';

export function PortalTrackPriorityBanner() {
  const [savedTrackId, setSavedTrackId] = useState<TrackId | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const syncSavedTrack = (): void => {
      try {
        const stored = window.localStorage.getItem(NKL_SELECTED_TRACK_KEY);
        if (isValidTrackId(stored)) {
          setSavedTrackId(stored);
          setDismissed(false);
          return;
        }
        setSavedTrackId(null);
      } catch {
        setSavedTrackId(null);
      }
    };

    const handleCustomUpdate = (event: Event): void => {
      const customEvent = event as CustomEvent<{ trackId?: unknown }>;
      const nextId = customEvent.detail?.trackId;
      if (isValidTrackId(nextId)) {
        setSavedTrackId(nextId);
        setDismissed(false);
        return;
      }
      if (nextId === null) {
        setSavedTrackId(null);
        setDismissed(true);
        return;
      }
      syncSavedTrack();
    };

    const handleStorage = (event: StorageEvent): void => {
      if (event.key === NKL_SELECTED_TRACK_KEY) {
        syncSavedTrack();
      }
    };

    const initialTimer = window.setTimeout(syncSavedTrack, 0);
    window.addEventListener(TRACK_UPDATED_EVENT, handleCustomUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener(TRACK_UPDATED_EVENT, handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (dismissed || !savedTrackId) {
    return null;
  }

  const activeTrack = getTrackById(savedTrackId);
  if (!activeTrack) {
    return null;
  }

  function handleShowAll(): void {
    try {
      window.localStorage.removeItem(NKL_SELECTED_TRACK_KEY);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
    setSavedTrackId(null);
    setDismissed(true);
    window.dispatchEvent(
      new CustomEvent(TRACK_UPDATED_EVENT, { detail: { trackId: null } }),
    );
  }

  return (
    <aside
      className="portal-track-priority-banner mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--portal-border-featured,#9ab0c9)] bg-[var(--portal-surface-featured,rgba(230,236,244,0.92))] p-4 shadow-[var(--portal-shadow)] sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      data-testid="portal-track-priority-banner"
      aria-label="Sua trilha escolhida no Portal NKL"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-featured-icon-bg,#122645)] text-[var(--portal-featured-icon-fg,#e6ecf4)]"
          aria-hidden="true"
        >
          <Compass size={19} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--portal-accent-text,#9a3412)]">
            Trilha salva
          </p>
          <p className="m-0 text-sm font-bold text-[var(--portal-ink-featured,#0b1526)] sm:text-base">
            Sua trilha salva: {activeTrack.title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={activeTrack.freePortalHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[var(--portal-border-strong,#93a5bd)] bg-[var(--portal-surface,rgba(223,230,239,0.86))] px-3.5 py-2 text-xs font-bold text-[var(--portal-ink,#0b1526)] no-underline transition-colors hover:bg-[var(--portal-surface-hover,#d5dee9)] sm:text-sm"
        >
          <span>Área aberta</span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        <Link
          href={`/ofertas/${activeTrack.recommendedProductSlug}`}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[var(--portal-cta-bg,#c2410c)] px-3.5 py-2 text-xs font-bold text-[var(--portal-cta-ink,#f4f7fa)] no-underline transition-colors hover:bg-[var(--portal-cta-bg-hover,#9a3412)] sm:text-sm"
        >
          <span>Material recomendado</span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={handleShowAll}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-[var(--portal-muted,#2a3b52)] transition-colors hover:border-[var(--portal-border,#aebccf)] hover:bg-[var(--portal-surface-hover,#d5dee9)] hover:text-[var(--portal-ink,#0b1526)] sm:text-sm"
        >
          <X size={15} aria-hidden="true" />
          <span>Ver tudo</span>
        </button>
      </div>
    </aside>
  );
}

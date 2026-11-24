'use client';

import { Pause, Waves } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

export const PORTAL_FLUID_STORAGE_KEY = 'portal-fluid-paused';
export const PORTAL_FLUID_TOGGLE_EVENT = 'portal-fluid-toggle';

const subscribeNoop = () => () => {};

function readStoredPaused(): boolean {
  try {
    return window.localStorage.getItem(PORTAL_FLUID_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Controle discreto na barra da home para pausar ou reativar o fluido e parallax interativo. */
export function PortalFluidToggle() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const syncPaused = (): void => {
      setPaused(readStoredPaused());
    };

    const handleCustomToggle = (event: Event): void => {
      const detail = (event as CustomEvent<{ paused?: unknown }>).detail;
      if (typeof detail?.paused === 'boolean') {
        setPaused(detail.paused);
        return;
      }
      syncPaused();
    };

    const initTimer = window.setTimeout(syncPaused, 0);
    window.addEventListener(PORTAL_FLUID_TOGGLE_EVENT, handleCustomToggle);
    window.addEventListener('storage', syncPaused);

    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener(PORTAL_FLUID_TOGGLE_EVENT, handleCustomToggle);
      window.removeEventListener('storage', syncPaused);
    };
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="portal-theme-btn"
        data-testid="portal-fluid-toggle"
        aria-label="Pausar fundo fluido"
        aria-pressed={false}
        disabled
      >
        <Waves size={18} aria-hidden="true" />
      </button>
    );
  }

  const togglePaused = (): void => {
    const nextPaused = !paused;
    try {
      window.localStorage.setItem(PORTAL_FLUID_STORAGE_KEY, String(nextPaused));
    } catch {
      // Ignore storage access errors in private contexts.
    }
    setPaused(nextPaused);
    window.dispatchEvent(
      new CustomEvent(PORTAL_FLUID_TOGGLE_EVENT, { detail: { paused: nextPaused } }),
    );
  };

  return (
    <button
      type="button"
      onClick={togglePaused}
      className="portal-theme-btn"
      data-testid="portal-fluid-toggle"
      aria-label={paused ? 'Ativar fundo fluido' : 'Pausar fundo fluido'}
      aria-pressed={paused}
      title={paused ? 'Ativar fundo fluido interativo' : 'Pausar fundo fluido'}
    >
      {paused ? <Pause size={18} aria-hidden="true" /> : <Waves size={18} aria-hidden="true" />}
    </button>
  );
}

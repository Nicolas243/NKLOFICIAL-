'use client';

import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { useTheme } from '@/components/theme-provider';

const subscribeNoop = () => () => {};

/** Botao de alternancia de tema escopado para a pagina inicial do Portal NKL. */
export function PortalThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <button
        type="button"
        className="portal-theme-btn"
        data-testid="portal-theme-toggle"
        aria-label="Alternar tema"
        aria-pressed={false}
        disabled
      >
        <Image
          src="/NKL/moonsun-portal.png"
          alt=""
          width={26}
          height={26}
          className="portal-theme-icon"
          aria-hidden="true"
        />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="portal-theme-btn"
      data-testid="portal-theme-toggle"
      aria-label="Alternar tema"
      aria-pressed={isDark}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      <Image
        src="/NKL/moonsun-portal.png"
        alt=""
        width={26}
        height={26}
        className="portal-theme-icon"
        aria-hidden="true"
      />
    </button>
  );
}

'use client';

import { Moon, Sun } from 'lucide-react';
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
        <Moon size={18} aria-hidden="true" />
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
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

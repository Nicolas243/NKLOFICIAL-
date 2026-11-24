'use client';

import * as React from 'react';

type Theme = 'light' | 'dark';

export type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyTheme(next: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', next === 'dark');
  root.dataset.theme = next;
  root.style.colorScheme = next;
}

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem('theme');
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(next: Theme): void {
  try {
    window.localStorage.setItem('theme', next);
  } catch {
    // Ignore storage quota/privacy restrictions cleanly.
  }
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const defaultTheme = props.defaultTheme ?? 'light';
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  React.useEffect(() => {
    const storedTheme = readStoredTheme();
    const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const nextTheme: Theme = storedTheme
      ? storedTheme
      : props.enableSystem
        ? systemTheme
        : defaultTheme;

    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
    // Sincroniza estado React com localStorage na montagem inicial sem sobrescrever tema salvo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(nextTheme);
  }, [defaultTheme, props.enableSystem]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
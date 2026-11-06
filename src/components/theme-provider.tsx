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

const THEME_CHANGE_THROTTLE_MS = 180;

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

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
  const lastThemeChange = React.useRef(0);

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const nextTheme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : props.enableSystem
        ? systemTheme
        : defaultTheme;

    React.startTransition(() => {
      setThemeState(nextTheme);
    });
  }, [defaultTheme, props.enableSystem]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    const now = Date.now();
    if (now - lastThemeChange.current < THEME_CHANGE_THROTTLE_MS) return;
    lastThemeChange.current = now;
    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getSetting, setSetting } from '../db/database';
import { ACCENT_OPTIONS, makeTheme, Theme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  dark: boolean;
  accent: string;
  setDark: (v: boolean) => void;
  setAccent: (v: string) => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function useTheme(): Theme {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

export function useThemeSettings(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState<boolean>(() => getSetting('dark_mode') === '1');
  const [accent, setAccentState] = useState<string>(() => getSetting('accent_color') ?? ACCENT_OPTIONS[0]);

  const setDark = useCallback((v: boolean) => {
    setDarkState(v);
    setSetting('dark_mode', v ? '1' : '0');
  }, []);

  const setAccent = useCallback((v: string) => {
    setAccentState(v);
    setSetting('accent_color', v);
  }, []);

  const theme = useMemo(() => makeTheme(dark, accent), [dark, accent]);
  const value = useMemo(
    () => ({ theme, dark, accent, setDark, setAccent }),
    [theme, dark, accent, setDark, setAccent]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

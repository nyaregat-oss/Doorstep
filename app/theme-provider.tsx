'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextValue = { dark: boolean; toggle: () => void };
const ThemeContext = createContext<ThemeContextValue>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, []);
  const toggle = () => setDark((value) => {
    const next = !value;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('theme', next ? 'dark' : 'light');
    return next;
  });
  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

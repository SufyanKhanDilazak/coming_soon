'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isThemeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  isThemeLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const currentTheme = theme === 'system' ? resolvedTheme : theme;
  const isDarkMode = currentTheme === 'dark';

  const updateThemeVariables = useCallback((isDark: boolean) => {
    const root = document.documentElement;

    requestAnimationFrame(() => {
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);

      const properties = isDark
        ? {
            '--theme-primary': '#a90068',
            '--theme-primary-hover': '#8a0055',
            '--theme-bg': '#0f0f23',
            '--theme-surface': '#1a1a2e',
            '--theme-text': '#ffffff',
            '--theme-text-muted': '#94a3b8',
            '--theme-border': '#374151',
            '--theme-accent': '#a90068',
          }
        : {
            '--theme-primary': '#3b82f6',
            '--theme-primary-hover': '#2563eb',
            '--theme-bg': '#ffffff',
            '--theme-surface': '#f8fafc',
            '--theme-text': '#000000',
            '--theme-text-muted': '#64748b',
            '--theme-border': '#e5e7eb',
            '--theme-accent': '#3b82f6',
          };

      Object.entries(properties).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', isDark ? '#0f0f23' : '#ffffff');
      }
    });
  }, []);

  // On theme resolution, apply styles
  useEffect(() => {
    if (currentTheme) {
      updateThemeVariables(isDarkMode);
      setIsThemeLoaded(true);
    }
  }, [currentTheme, isDarkMode, updateThemeVariables]);

  const toggleTheme = useCallback(() => {
    const next = isDarkMode ? 'light' : 'dark';
    updateThemeVariables(!isDarkMode);
    setTheme(next);
  }, [isDarkMode, setTheme, updateThemeVariables]);

  const contextValue = useMemo(
    () => ({
      isDarkMode,
      toggleTheme,
      isThemeLoaded,
    }),
    [isDarkMode, toggleTheme, isThemeLoaded]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

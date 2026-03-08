import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app-theme-mode';

const algorithmMap = {
  light: antdTheme.defaultAlgorithm,
  dark: antdTheme.darkAlgorithm,
} as const satisfies Record<ThemeMode, typeof antdTheme.defaultAlgorithm>;

const getInitialTheme = (): ThemeMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

interface ThemeContextValue {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemeMode = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used inside <ThemeProvider>');
  }
  return ctx;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Keep the document background in sync so areas outside antd components
  // (e.g., html/body) don't flash white in dark mode.
  useEffect(() => {
    const { colorBgLayout } = antdTheme.getDesignToken({ algorithm: algorithmMap[themeMode] });
    document.body.style.background = colorBgLayout;
  }, [themeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeMode, toggleTheme }),
    [themeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={{ algorithm: algorithmMap[themeMode] }}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

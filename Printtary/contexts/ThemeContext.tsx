import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeMode, THEME_STORAGE_KEY, ThemeMode } from '@/constants/theme';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setThemeMode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(() => {
        if (!mounted) return;
        applyThemeMode('light');
        setThemeMode('light');
        AsyncStorage.setItem(THEME_STORAGE_KEY, 'light').catch(() => undefined);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    setMode: async (nextMode) => {
      const lockedMode: ThemeMode = 'light';
      if (nextMode !== lockedMode || mode !== lockedMode) {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, lockedMode);
        applyThemeMode(lockedMode);
        setThemeMode(lockedMode);
      }
    },
  }), [mode]);

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return context;
}

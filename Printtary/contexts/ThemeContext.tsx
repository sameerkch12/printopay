import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { DevSettings, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeMode, getActiveThemeMode, THEME_STORAGE_KEY, ThemeMode } from '@/constants/theme';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function reloadApp() {
  if (Platform.OS === 'web') {
    globalThis.location?.reload();
    return;
  }

  (DevSettings as { reload?: () => void }).reload?.();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setThemeMode] = useState<ThemeMode>(getActiveThemeMode());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        const savedMode = stored === 'dark' || stored === 'light' ? stored : 'light';
        applyThemeMode(savedMode);
        setThemeMode(savedMode);
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
      if (nextMode === mode) return;
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
      applyThemeMode(nextMode);
      setThemeMode(nextMode);
      reloadApp();
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

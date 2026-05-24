// PrintoPay Design System
export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'printopay:theme-mode';

const brandColors = {
  // Brand
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryGlow: 'rgba(99,102,241,0.25)',

  // Accent
  accent: '#a855f7',
  accentLight: '#c084fc',
  accentGlow: 'rgba(168,85,247,0.2)',

  // Status
  success: '#22c55e',
  successLight: '#4ade80',
  successGlow: 'rgba(34,197,94,0.2)',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  error: '#ef4444',
  errorLight: '#f87171',
  errorGlow: 'rgba(239,68,68,0.2)',
  info: '#3b82f6',
};

const lightPalette = {
  ...brandColors,

  // Background tiers
  bg: '#ffffff',
  bgCard: '#ffffff',
  bgElevated: '#f1f5f9',
  bgSurface: '#eef2ff',
  bgInput: '#ffffff',
  bgOverlay: 'rgba(255,255,255,0.9)',

  // Border
  border: 'rgba(15,23,42,0.1)',
  borderFocus: 'rgba(99,102,241,0.35)',
  borderSubtle: 'rgba(15,23,42,0.06)',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textInverse: '#ffffff',

  // Gradient stops
  gradientPrimary: ['#6366f1', '#a855f7'],
  gradientDark: ['#ffffff', '#eef2ff'],
  gradientCard: ['rgba(255,255,255,1)', 'rgba(238,242,255,0.9)'],
};

const darkPalette = {
  ...brandColors,

  // Background tiers
  bg: '#080b14',
  bgCard: '#0f1220',
  bgElevated: '#141828',
  bgSurface: '#1a2035',
  bgInput: '#1e2540',
  bgOverlay: 'rgba(8,11,20,0.85)',

  // Border
  border: 'rgba(255,255,255,0.07)',
  borderFocus: 'rgba(99,102,241,0.6)',
  borderSubtle: 'rgba(255,255,255,0.04)',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  textInverse: '#080b14',

  // Gradient stops
  gradientPrimary: ['#6366f1', '#a855f7'],
  gradientDark: ['#0f1220', '#1a2035'],
  gradientCard: ['rgba(99,102,241,0.1)', 'rgba(168,85,247,0.05)'],
};

export const themePalettes = {
  light: lightPalette,
  dark: darkPalette,
};

let activeThemeMode: ThemeMode = 'light';

export const Colors = { ...lightPalette };

export function getActiveThemeMode() {
  return activeThemeMode;
}

export function applyThemeMode(mode: ThemeMode) {
  activeThemeMode = mode;
  Object.assign(Colors, themePalettes[mode]);
  Object.assign(Shadow.card, {
    shadowColor: mode === 'dark' ? '#000' : '#94a3b8',
    shadowOpacity: mode === 'dark' ? 0.3 : 0.18,
  });
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeight: Record<string, '400' | '500' | '600' | '700' | '800'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const Shadow = {
  card: {
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  success: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
};

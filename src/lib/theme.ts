import type { BrandConfig, ThemeName } from '@/lib/types';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  fontFamily: string;
}

const themeDefaults: Record<ThemeName, Omit<ThemeTokens, 'primary' | 'secondary' | 'accent' | 'fontFamily'>> = {
  editorial: {
    bg: '#FAF5F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F5EDE3',
    text: '#2D1B0E',
    textMuted: '#7A6A5A',
    textOnPrimary: '#FFFFFF',
    border: '#E5D9C9',
  },
  dark: {
    bg: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    border: '#334155',
  },
  fresh: {
    bg: '#F5F3EC',
    surface: '#FFFFFF',
    surfaceAlt: '#EDEFE5',
    text: '#1A2E1F',
    textMuted: '#5A6B5E',
    textOnPrimary: '#FFFFFF',
    border: '#D5DAC8',
  },
};

export function resolveThemeTokens(brand: BrandConfig): ThemeTokens {
  const defaults = themeDefaults[brand.theme] ?? themeDefaults.editorial;
  return {
    ...defaults,
    primary: brand.primaryColor || defaults.text,
    secondary: brand.secondaryColor || defaults.textMuted,
    accent: brand.accentColor || defaults.border,
    fontFamily: brand.fontFamily || 'inherit',
  };
}

export function applyThemeToElement(el: HTMLElement, tokens: ThemeTokens) {
  el.style.setProperty('--cafe-bg', tokens.bg);
  el.style.setProperty('--cafe-surface', tokens.surface);
  el.style.setProperty('--cafe-surface-alt', tokens.surfaceAlt);
  el.style.setProperty('--cafe-text', tokens.text);
  el.style.setProperty('--cafe-text-muted', tokens.textMuted);
  el.style.setProperty('--cafe-text-on-primary', tokens.textOnPrimary);
  el.style.setProperty('--cafe-primary', tokens.primary);
  el.style.setProperty('--cafe-secondary', tokens.secondary);
  el.style.setProperty('--cafe-accent', tokens.accent);
  el.style.setProperty('--cafe-border', tokens.border);
  el.style.setProperty('--cafe-font', tokens.fontFamily);
}

export function getButtonClass(buttonStyle: string | undefined): string {
  switch (buttonStyle) {
    case 'pill':
      return 'rounded-full';
    case 'square':
      return 'rounded-none';
    case 'rounded':
    default:
      return 'rounded-xl';
  }
}

export function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#FFFFFF';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1A1A1A' : '#FFFFFF';
}

import { ViewStyle } from 'react-native';

export type AccentColor = string;

interface BaseTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  raised: string;
  ink: string;
  sub: string;
  faint: string;
  hair: string;
  hairStrong: string;
  fieldBg: string;
  pill: string;
  shadow: ViewStyle;
  shadowSoft: ViewStyle;
}

const LIGHT: BaseTokens = {
  bg: '#F1EEE8',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFAF6',
  raised: '#FFFFFF',
  ink: '#272520',
  sub: '#78736A',
  faint: '#A8A39A',
  hair: 'rgba(39,37,32,0.08)',
  hairStrong: 'rgba(39,37,32,0.14)',
  fieldBg: '#FFFFFF',
  pill: 'rgba(39,37,32,0.05)',
  shadow: {
    shadowColor: '#272520',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  shadowSoft: {
    shadowColor: '#272520',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};

const DARK: BaseTokens = {
  bg: '#100F0E',
  surface: '#1B1A18',
  surfaceAlt: '#211F1D',
  raised: '#232220',
  ink: '#F2EFE9',
  sub: '#9A958C',
  faint: '#67635C',
  hair: 'rgba(255,255,255,0.09)',
  hairStrong: 'rgba(255,255,255,0.16)',
  fieldBg: '#211F1D',
  pill: 'rgba(255,255,255,0.07)',
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  shadowSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
};

// ── tiny color helpers ─────────────────────────────────────────
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function hexA(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export function lighten(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

// Static-weight Google Fonts don't support synthetic fontWeight remapping on
// RN — pick the loaded family that matches the design's intended weight
// instead of setting `fontWeight`.
export function zenFont(weight: number = 400): string {
  if (weight >= 850) return 'ZenKakuGothicNew_900Black';
  if (weight >= 650) return 'ZenKakuGothicNew_700Bold';
  if (weight >= 450) return 'ZenKakuGothicNew_500Medium';
  return 'ZenKakuGothicNew_400Regular';
}
export function monoFont(weight: number = 400): string {
  return weight >= 450 ? 'DMMono_500Medium' : 'DMMono_400Regular';
}

export interface Theme extends BaseTokens {
  dark: boolean;
  accent: AccentColor;
  accentSoft: string;
  accentInk: string;
  font: (weight?: number) => string;
  mono: (weight?: number) => string;
}

export function makeTheme(dark: boolean, accent: AccentColor): Theme {
  const base = dark ? DARK : LIGHT;
  const accentSoft = hexA(accent, dark ? 0.2 : 0.12);
  const accentInk = dark ? lighten(accent, 0.18) : accent;
  return { ...base, dark, accent, accentSoft, accentInk, font: zenFont, mono: monoFont };
}

export const ACCENT_OPTIONS = ['#5B63D3', '#2F9E8F', '#C2714F', '#9B5FB8'];

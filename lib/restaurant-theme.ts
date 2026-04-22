type ThemeCssVars = Record<string, string>;

const HEX_COLOR_RE = /^#([0-9a-fA-F]{6})$/;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const rr = clamp(Math.round(r), 0, 255).toString(16).padStart(2, '0');
  const gg = clamp(Math.round(g), 0, 255).toString(16).padStart(2, '0');
  const bb = clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function normalizeThemePrimaryColor(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!HEX_COLOR_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

export function getThemePrimaryForeground(primaryHex: string): string {
  return luminance(primaryHex) > 0.5 ? '#0f172a' : '#ffffff';
}

export function buildThemeCssVars(primaryRaw?: string | null): ThemeCssVars {
  const primary = normalizeThemePrimaryColor(primaryRaw);
  if (!primary) return {};
  const primaryDark = darken(primary, 0.18);
  return {
    '--primary': primary,
    '--ring': primary,
    '--sidebar-primary': primary,
    '--restaurant-primary': primary,
    '--restaurant-primary-dark': primaryDark,
    '--primary-foreground': getThemePrimaryForeground(primary),
    '--sidebar-primary-foreground': getThemePrimaryForeground(primary),
  };
}

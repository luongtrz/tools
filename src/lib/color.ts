export function hexToRgb(hex: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} | null {
  const value = hex.replace("#", "").trim();
  if (![3, 4, 6, 8].includes(value.length)) return null;
  if (!/^[0-9a-fA-F]+$/.test(value)) return null;
  let r: number;
  let g: number;
  let b: number;
  let a = 1;
  if (value.length === 3 || value.length === 4) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
    if (value.length === 4) a = parseInt(value[3] + value[3], 16) / 255;
  } else {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
    if (value.length === 8) a = parseInt(value.slice(6, 8), 16) / 255;
  }
  return { r, g, b, a };
}

export function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  const alpha = a < 1 ? toHex(Math.round(a * 255)) : "";
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`.toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): {
  h: number;
  s: number;
  l: number;
} {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = ln - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function parseColor(input: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) return hexToRgb(trimmed);
  const rgbMatch = /^rgba?\(([^)]+)\)$/i.exec(trimmed);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts[3] !== undefined ? parseAlpha(parts[3]) : 1;
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a: Number.isNaN(a) ? 1 : a };
  }
  const hslMatch = /^hsla?\(([^)]+)\)$/i.exec(trimmed);
  if (hslMatch) {
    const parts = hslMatch[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = Number(parts[0]);
    const s = Number(parts[1].replace("%", ""));
    const l = Number(parts[2].replace("%", ""));
    const a = parts[3] !== undefined ? parseAlpha(parts[3]) : 1;
    if ([h, s, l].some((n) => Number.isNaN(n))) return null;
    const { r, g, b } = hslToRgb(h, s, l);
    return { r, g, b, a: Number.isNaN(a) ? 1 : a };
  }
  return null;
}

function parseAlpha(value: string): number {
  const parsed = Number(value.replace(/%$/, ""));
  if (Number.isNaN(parsed)) return 1;
  return value.trim().endsWith("%") ? parsed / 100 : parsed;
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const la = relativeLuminance(a.r, a.g, a.b);
  const lb = relativeLuminance(b.r, b.g, b.b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Color math for deterministic perceptual tests.
 *
 * Chrome 149 returns computed colors as oklch() (incl. alpha as ` / a`);
 * older browsers return rgb()/rgba(). This lib parses both, converts to a
 * common OKLab representation, and exposes the metrics the visual tests need:
 *
 *   - luminance() / contrast()  → WCAG text contrast (AA = 4.5:1)
 *   - deltaL()                  → |ΔL| in OKLab, the right metric for
 *                                 "are two ADJACENT FILLS distinguishable"
 *                                 (text-contrast is the wrong tool there)
 *   - alpha()                   → for catching translucent hovers that fade
 *                                 to a near-invisible veil
 *   - compositeOver()           → flatten a translucent color over an opaque
 *                                 bg so perceptual deltas reflect what the
 *                                 eye actually sees
 *
 * No browser dependency — pure math, so it's fast and deterministic.
 */

const TAU = Math.PI * 2;

export interface OkLab {
  L: number;
  a: number;
  b: number;
  alpha: number;
}

function srgbToOklab(r: number, g: number, b: number): OkLab {
  // r,g,b in 0..1 gamma sRGB → linear → OKLab.
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const lr = lin(r),
    lg = lin(g),
    lb = lin(b);
  const l_ = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m_ = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s_ = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
    alpha: 1,
  };
}

function oklabToLinearSrgb(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const [l, m, s] = [l_, m_, s_].map((x) => x ** 3);
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function num(token: string | undefined, fallback = 0): number {
  if (!token || token === "none") return fallback;
  return parseFloat(token);
}

/** Parse a computed color string ("oklch(...)" | "oklab(...)" | "rgb(...)") to OKLab. */
export function toOklab(color: string): OkLab {
  // color-mix(in oklab, …) serializes as oklab(L a b / alpha).
  const lab = color.match(
    /oklab\(\s*(-?[\d.]+|%|none)[\s/]+(-?[\d.]+|none)[\s/]+(-?[\d.]+|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/i,
  );
  if (lab) {
    let L = num(lab[1]);
    if (lab[1]?.endsWith("%")) L = L / 100;
    let alpha = lab[4] === undefined ? 1 : num(lab[4]);
    if (lab[4]?.endsWith("%")) alpha = alpha / 100;
    return { L, a: num(lab[2]), b: num(lab[3]), alpha };
  }
  const ok = color.match(
    /oklch\(\s*([\d.]+%?|none)[\s/]+([\d.]+|none)[\s/]+([\d.]+(?:deg|rad|grad|turn)?|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/i,
  );
  if (ok) {
    let L = num(ok[1]);
    if (ok[1]?.endsWith("%")) L = L / 100;
    const C = num(ok[2]);
    const h = num(ok[3]);
    const a = C * Math.cos((h / 360) * TAU);
    const b = C * Math.sin((h / 360) * TAU);
    let alpha = ok[4] === undefined ? 1 : num(ok[4]);
    if (ok[4]?.endsWith("%")) alpha = alpha / 100;
    return { L, a, b, alpha };
  }
  const rgb = color.match(
    /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i,
  );
  if (rgb) {
    const [r, g, b] = [+rgb[1], +rgb[2], +rgb[3]].map((c) => c / 255);
    const lab = srgbToOklab(r, g, b);
    lab.alpha = rgb[4] === undefined ? 1 : +rgb[4];
    return lab;
  }
  return { L: 0, a: 0, b: 0, alpha: 0 };
}

/** WCAG relative luminance (0..1), treating the color as opaque. */
export function luminance(color: string): number {
  const { L, a, b } = toOklab(color);
  const [r, g, bl] = oklabToLinearSrgb(L, a, b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

/** WCAG contrast ratio between two colors (≥1:1). */
export function contrast(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Absolute OKLab lightness difference (0..1). Right metric for adjacent fills. */
export function deltaL(a: string, b: string): number {
  return Math.abs(toOklab(a).L - toOklab(b).L);
}

/** Alpha channel (0..1). */
export function alpha(color: string): number {
  return toOklab(color).alpha;
}

/** Source-over composite of a (possibly translucent) fg over an opaque bg.
 * Returns an opaque oklch() string — what the eye actually sees. */
export function compositeOver(fg: string, bg: string): string {
  const f = toOklab(fg);
  const back = toOklab(bg);
  if (f.alpha >= 1) return fg;
  const a = f.alpha;
  return `oklch(${(f.L * a + back.L * (1 - a)).toFixed(4)} 0 0)`;
}

import { test, expect } from "@playwright/test";

/**
 * WCAG 2.2 contrast guard for Porchlight's semantic color pairs.
 *
 * Reads RESOLVED colors from real elements styled by the --pl-* tokens on the
 * themes preview page, so a token edit that breaks contrast fails this test —
 * no hand-maintained value list to drift. Verifies the key text pairs in BOTH
 * light and dark (PLAN §6 acceptance criterion: AA = 4.5:1).
 */

// Chrome 149 returns computed colors as oklch(); older browsers return rgb().
// Parse both, convert to sRGB relative luminance for the WCAG formula.
const TAU = Math.PI * 2;

function oklab(L: number, a: number, b: number) {
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

function luminance(color: string): number {
  // oklch(L% C H) or oklch(L C H) -> linear sRGB -> relative luminance.
  const ok = color.match(/oklch\(\s*([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)/);
  if (ok) {
    const L = +ok[1] / (ok[2] ? 100 : 1);
    const [r, g, b] = oklab(
      L,
      +ok[3] * Math.cos((+ok[4] / 360) * TAU),
      +ok[3] * Math.sin((+ok[4] / 360) * TAU),
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // rgb(r g b) fallback.
  const [r, g, b] = (color.match(/[\d.]+/g) ?? []).map(Number);
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (fg: string, bg: string) => {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const AA = 4.5;

const pairs = [
  {
    name: "accent (link) on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-accent)",
  },
  {
    name: "accent-text on accent (btn)",
    bg: "var(--pl-color-accent)",
    fg: "var(--pl-color-accent-text)",
  },
  {
    name: "danger-text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-danger-text)",
  },
  {
    name: "success-text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-success-text)",
  },
  {
    name: "warning-text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-warning-text)",
  },
] as const;

/** Resolve a (bg, fg) token pair to [bgColor, fgColor] rgb strings in a theme. */
async function resolve(page: import("@playwright/test").Page, theme: string) {
  return page.evaluate(
    ([pairs, theme]) => {
      const root = document.querySelector(".playground") as HTMLElement;
      root.setAttribute("data-theme", theme);
      return pairs.map((p) => {
        const host = document.createElement("div");
        host.style.background = p.bg;
        const child = document.createElement("span");
        child.style.color = p.fg;
        host.append(child);
        root.append(host);
        const result: [string, string] = [
          getComputedStyle(host).backgroundColor,
          getComputedStyle(child).color,
        ];
        host.remove();
        return { name: p.name, colors: result };
      });
    },
    [pairs, theme] as const,
  );
}

for (const theme of ["light", "dark"] as const) {
  test(`semantic text pairs meet WCAG AA in ${theme}`, async ({ page }) => {
    await page.goto("./preview/themes");
    const results = await resolve(page, theme);
    for (const { name, colors } of results) {
      const [bg, fg] = colors;
      const ratio = contrast(fg, bg);
      expect(
        ratio,
        `${name} in ${theme}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA);
    }
  });
}

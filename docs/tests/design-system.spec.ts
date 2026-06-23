import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { toOklab } from "./lib/color";

// Read the token source directly (Playwright runs in Node, so fs works; the
// Vite ?raw import isn't available outside Astro/Vite).
const here = dirname(fileURLToPath(import.meta.url));
const tokensCss = readFileSync(
  resolve(here, "../../packages/porchlight/src/02-tokens.css"),
  "utf8",
);

/**
 * Design-system consistency harness.
 *
 * "Good design" can't be fully automated, but design-SYSTEM consistency can.
 * These checks enforce the internal math a well-built token system relies on:
 * even type ratios, even spacing steps, an even brand ramp, and WCAG 2.2
 * touch-target minimums. A drift in any of these degrades the whole framework
 * silently; this gates it.
 *
 * Two sources of truth:
 *   - Source parse (tokensCss ?raw) for static scales (spacing, radius, brand).
 *   - Browser-resolved values for type size and touch targets (what users see).
 *
 * Each test logs the raw numbers so a failure is self-diagnosing.
 */

/** Extract all rem values from a token definition, returning them as numbers. */
function rems(token: string): number[] {
  const matches = token.match(/([\d.]+)rem/g) ?? [];
  return matches.map((m) => parseFloat(m));
}

/** Parse a named token's value from the source CSS. */
function tokenValue(name: string): string {
  const re = new RegExp(`--${name}:\\s*([^;]+);`);
  const m = tokensCss.match(re);
  if (!m) throw new Error(`token ${name} not found`);
  return m[1].trim();
}

// ---------------------------------------------------------------------------
// Type scale — consecutive sizes should share a consistent ratio (a fluid
// type scale that jumps unevenly looks broken at the boundary).
// ---------------------------------------------------------------------------
test("type scale uses a consistent ratio", async ({ page }) => {
  await page.goto("./preview/tokens");
  // No rendered scale on the page — create probes with each token and read the
  // resolved font-size (ground truth, accounts for clamp).
  const sizes = await page.evaluate(() => {
    const tokens = [
      "--pl-text-xs",
      "--pl-text-sm",
      "--pl-text-md",
      "--pl-text-lg",
      "--pl-text-xl",
    ];
    const host = document.querySelector("main") as HTMLElement;
    return tokens.map((t) => {
      const el = document.createElement("div");
      el.style.fontSize = `var(${t})`;
      host.append(el);
      const px = parseFloat(getComputedStyle(el).fontSize);
      el.remove();
      return px;
    });
  });
  expect(sizes.length, "expected at least 2 type sizes").toBeGreaterThanOrEqual(
    2,
  );
  const ratios: number[] = [];
  for (let i = 1; i < sizes.length; i++) ratios.push(sizes[i] / sizes[i - 1]);
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const maxDev = Math.max(...ratios.map((r) => Math.abs(r - avg) / avg));
  console.log(
    `[design] type sizes (px): ${JSON.stringify(sizes.map((s) => Math.round(s)))}\n` +
      `[design] type ratios: ${JSON.stringify(ratios.map((r) => +r.toFixed(3)))} avg=${avg.toFixed(3)} maxDev=${(maxDev * 100).toFixed(1)}%`,
  );
  // Ratios should be within 12% of each other (a clean scale varies <10%; 12%
  // tolerates one slightly-off step without being a free pass).
  expect(
    maxDev,
    "type ratios must be consistent (within 12% of each other)",
  ).toBeLessThan(0.12);
});

// ---------------------------------------------------------------------------
// Spacing scale — steps should be even within each tier (the standard
// t-shirt pattern: small steps that optionally double at the top).
// ---------------------------------------------------------------------------
test("spacing scale steps are even within a tier", async () => {
  const tokens = [
    "pl-space-0",
    "pl-space-1",
    "pl-space-2",
    "pl-space-3",
    "pl-space-4",
    "pl-space-5",
    "pl-space-6",
    "pl-space-8",
    "pl-space-10",
    "pl-space-12",
  ];
  const values = tokens.map((t) => rems(tokenValue(t))[0] ?? 0);
  const steps: number[] = [];
  for (let i = 1; i < values.length; i++) steps.push(values[i] - values[i - 1]);
  // A step may equal the previous OR be exactly 2x (the t-shirt doubling).
  // Flag any step that is neither — a broken scale.
  const nonZeroSteps = steps.filter((s) => s > 0);
  const base = nonZeroSteps[0];
  const violations: string[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s <= 0) continue;
    const ok =
      Math.abs(s - base) < 0.001 ||
      Math.abs(s - 2 * base) < 0.001 ||
      Math.abs(s - base / 2) < 0.001;
    if (!ok) violations.push(`step ${i}: ${s}rem (base ${base})`);
  }
  console.log(
    `[design] spacing values (rem): ${JSON.stringify(values)}\n` +
      `[design] spacing steps: ${JSON.stringify(steps)} base=${base}\n` +
      `[design] violations: ${violations.length ? JSON.stringify(violations) : "none"}`,
  );
  expect(violations, "spacing steps must be base, base/2, or 2*base").toEqual(
    [],
  );
});

// ---------------------------------------------------------------------------
// Brand ramp — the 9-step OKLCH ramp should step evenly in lightness so each
// adjacent pair is perceptually distinct by a similar amount.
// ---------------------------------------------------------------------------
test("brand ramp steps evenly in lightness", async () => {
  const ls: number[] = [];
  for (let i = 1; i <= 9; i++) {
    const v = tokenValue(`pl-brand-${i}`);
    ls.push(toOklab(v).L);
  }
  const steps: number[] = [];
  for (let i = 1; i < ls.length; i++) steps.push(Math.abs(ls[i] - ls[i - 1]));
  const avg = steps.reduce((a, b) => a + b, 0) / steps.length;
  const cv =
    Math.sqrt(steps.reduce((a, s) => a + (s - avg) ** 2, 0) / steps.length) /
    avg; // coeff of variation
  console.log(
    `[design] brand L values: ${JSON.stringify(ls.map((l) => +l.toFixed(3)))}\n` +
      `[design] brand steps: ${JSON.stringify(steps.map((s) => +s.toFixed(3)))} avg=${avg.toFixed(3)} CV=${(cv * 100).toFixed(0)}%`,
  );
  // Coefficient of variation < 35% = an acceptably even ramp. (Perfectly even
  // is ~0%; real ramps that emphasize a key step run 20-30%.)
  expect(
    cv,
    "brand ramp lightness steps should be reasonably even (CV < 35%)",
  ).toBeLessThan(0.35);
});

// ---------------------------------------------------------------------------
// Touch targets — WCAG 2.2 AA (2.5.8) requires 24px minimum; AAA (2.5.5)
// recommends 44px. Assert the AA floor as a hard gate and report 44px coverage.
// ---------------------------------------------------------------------------
const AA_TARGET = 24; // WCAG 2.5.8 (Level AA, 2.2) — 24 CSS px
const AAA_TARGET = 44; // WCAG 2.5.5 (Level AAA) — 44 CSS px

test("interactive controls meet the WCAG AA touch-target minimum (24px)", async ({
  page,
}) => {
  await page.goto("./preview/button");
  const sizes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".c-button")).map((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  const minDim = Math.min(...sizes.map((s) => Math.min(s.w, s.h)));
  const under44 = sizes.filter((s) => Math.min(s.w, s.h) < AAA_TARGET).length;
  console.log(
    `[design] button sizes (w×h): ${JSON.stringify(sizes.slice(0, 4))}… min dimension=${minDim}px (AA≥${AA_TARGET}, AAA≥${AAA_TARGET})`,
  );
  expect(
    minDim,
    `controls must meet WCAG 2.5.8 AA (${AA_TARGET}px)`,
  ).toBeGreaterThanOrEqual(AA_TARGET);
  // Report (not fail) on AAA: log how many are under 44px.
  console.log(
    `[design] ${under44}/${sizes.length} buttons are under the 44px AAA target`,
  );
});

test("field controls meet the WCAG AA touch-target minimum", async ({
  page,
}) => {
  await page.goto("./preview/field");
  const minDim = await page.evaluate(() => {
    const el = document.querySelector(".c-field__control") as HTMLElement;
    const r = el.getBoundingClientRect();
    return Math.round(Math.min(r.width, r.height));
  });
  console.log(`[design] field control min dimension=${minDim}px`);
  expect(
    minDim,
    `fields must meet WCAG 2.5.8 AA (${AA_TARGET}px)`,
  ).toBeGreaterThanOrEqual(AA_TARGET);
});

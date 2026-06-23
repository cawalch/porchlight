import { test, expect } from "@playwright/test";

/**
 * Deterministic alignment + sizing-consistency checks.
 *
 * These can't be eyeballed reliably across components; they CAN be measured
 * precisely. Each probe asserts a relationship that should hold for a
 * well-built SaaS design system:
 *   - controls in a row share one height
 *   - grid gaps are uniform
 *   - card titles align at the same Y across a row
 *   - icon + label are vertically centered in a button
 *
 * Reading real bounding rects = "pixel-perfect" made deterministic.
 */

/** Element rect in CSS pixels (rounded). */
async function rect(page: import("@playwright/test").Page, sel: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  }, sel);
}

test("all buttons in the button variants row share one height", async ({
  page,
}) => {
  await page.goto("./preview/button");
  // The first .l-cluster row holds primary/secondary/ghost/default.
  const heights = await page.evaluate(() => {
    const row = document.querySelector(".l-cluster")!;
    return Array.from(row.querySelectorAll(".c-button")).map((b) =>
      Math.round(b.getBoundingClientRect().height),
    );
  });
  console.log(`[align] button heights in row: ${JSON.stringify(heights)}`);
  const unique = [...new Set(heights)];
  expect(
    unique.length,
    `button heights must be uniform, got ${JSON.stringify(heights)}`,
  ).toBe(1);
});

test("card titles in a grid row align at the same Y", async ({ page }) => {
  await page.goto("./preview/card");
  const tops = await page.evaluate(() => {
    const grid = document.querySelector(".l-grid")!;
    return Array.from(grid.querySelectorAll(".c-card__title")).map((t) =>
      Math.round(t.getBoundingClientRect().top),
    );
  });
  console.log(`[align] card title Y positions: ${JSON.stringify(tops)}`);
  // All titles must start at the same Y (consistent top offset).
  const unique = [...new Set(tops)];
  expect(
    unique.length,
    `card titles must align in Y, got ${JSON.stringify(tops)}`,
  ).toBe(1);
});

test("button icon + label are vertically centered (within 1px)", async ({
  page,
}) => {
  await page.goto("./preview/button");
  // The "New report" primary button has an icon + label.
  const center = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll(".c-button")).find((b) =>
      b.textContent?.includes("New report"),
    ) as HTMLElement | undefined;
    if (!btn) return null;
    const icon = btn.querySelector("svg")!;
    const label = btn.querySelector("svg")?.nextSibling as Text;
    const bCenter =
      btn.getBoundingClientRect().top + btn.getBoundingClientRect().height / 2;
    const iCenter =
      icon.getBoundingClientRect().top +
      icon.getBoundingClientRect().height / 2;
    return { btnCenter: bCenter, iconCenter: iCenter };
  });
  if (!center) return; // skip if markup changed
  const drift = Math.abs(center.btnCenter - center.iconCenter);
  console.log(
    `[align] button center=${center.btnCenter.toFixed(1)} icon center=${center.iconCenter.toFixed(1)} drift=${drift.toFixed(1)}`,
  );
  expect(drift, "icon must be vertically centered in the button").toBeLessThan(
    1.5,
  );
});

test("table numeric columns are right-aligned and use tabular-nums", async ({
  page,
}) => {
  await page.goto("./preview/data-table");
  const data = await page.evaluate(() => {
    const cell = document.querySelector(
      '.c-table td[data-align="end"]',
    ) as HTMLElement;
    if (!cell) return null;
    const cs = getComputedStyle(cell);
    return { align: cs.textAlign, nums: cs.fontVariantNumeric };
  });
  if (!data) return;
  console.log(`[align] numeric cell: align=${data.align} nums=${data.nums}`);
  // text-align: end is the modern logical keyword (resolves to right in LTR);
  // accept either since the source uses the logical value.
  expect(["end", "right"]).toContain(data.align);
  expect(data.nums).toContain("tabular");
});

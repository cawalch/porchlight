import { test, expect } from "@playwright/test";

/**
 * CSS Subgrid alignment checks.
 *
 * Validates Baseline CSS Subgrid support in Porchlight:
 * 1. Card Decks: [data-subgrid="rows"] aligns headers, bodies, and footers across cards.
 * 2. Two-column Forms: [data-layout="aligned"] aligns input controls to the widest label.
 */

test("card deck with subgrid rows aligns headers, bodies, and footers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("./preview/card");

  const metrics = await page.evaluate(() => {
    const supported =
      CSS.supports("grid-template-rows: subgrid") &&
      CSS.supports("grid-template-columns: subgrid");
    const deck = document.querySelector('.pl-l-grid[data-subgrid="rows"]');
    if (!deck) return { supported, found: false };

    const headers = Array.from(deck.querySelectorAll(".pl-c-card__header")).map(
      (h) => Math.round(h.getBoundingClientRect().bottom),
    );
    const bodies = Array.from(deck.querySelectorAll(".pl-c-card__body")).map(
      (b) => Math.round(b.getBoundingClientRect().top),
    );
    const footers = Array.from(deck.querySelectorAll(".pl-c-card__footer")).map(
      (f) => Math.round(f.getBoundingClientRect().top),
    );
    const cardHeights = Array.from(deck.querySelectorAll(".pl-c-card")).map(
      (c) => Math.round(c.getBoundingClientRect().height),
    );

    return {
      supported,
      found: true,
      headers,
      bodies,
      footers,
      cardHeights,
    };
  });

  expect(metrics.found).toBe(true);

  if (metrics.supported) {
    const uniqueHeaders = [...new Set(metrics.headers)];
    const uniqueBodies = [...new Set(metrics.bodies)];
    const uniqueFooters = [...new Set(metrics.footers)];
    const uniqueCardHeights = [...new Set(metrics.cardHeights)];

    expect(
      uniqueHeaders.length,
      `card headers must align at bottom, got ${JSON.stringify(metrics.headers)}`,
    ).toBe(1);
    expect(
      uniqueBodies.length,
      `card bodies must align at top, got ${JSON.stringify(metrics.bodies)}`,
    ).toBe(1);
    expect(
      uniqueFooters.length,
      `card footers must align at top, got ${JSON.stringify(metrics.footers)}`,
    ).toBe(1);
    expect(
      uniqueCardHeights.length,
      `card deck heights must be equal, got ${JSON.stringify(metrics.cardHeights)}`,
    ).toBe(1);
  }
});

test("two-column aligned form with subgrid columns aligns controls to widest label", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("./preview/form");

  const metrics = await page.evaluate(() => {
    const supported = CSS.supports("grid-template-columns: subgrid");
    const form = document.querySelector('.pl-c-form[data-layout="aligned"]');
    if (!form) return { supported, found: false };

    const controls = Array.from(
      form.querySelectorAll(".pl-c-field > .pl-c-field__control"),
    ).map((c) => Math.round(c.getBoundingClientRect().left));

    return {
      supported,
      found: true,
      controls,
    };
  });

  expect(metrics.found).toBe(true);

  if (metrics.supported) {
    const uniqueLefts = [...new Set(metrics.controls)];
    expect(
      uniqueLefts.length,
      `all input controls must share the same left X alignment, got ${JSON.stringify(metrics.controls)}`,
    ).toBe(1);
  }
});

test("two-column aligned form collapses to single column on narrow container", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("./preview/form");

  const collapsed = await page.evaluate(() => {
    const form = document.querySelector('.pl-c-form[data-layout="aligned"]');
    if (!form) return false;

    const firstField = form.querySelector(".pl-c-field");
    if (!firstField) return false;

    const label = firstField.querySelector(".pl-c-field__label");
    const control = firstField.querySelector(".pl-c-field__control");
    if (!label || !control) return false;

    const labelRect = label.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();

    // In stacked mode, control is below the label
    return controlRect.top >= labelRect.bottom;
  });

  expect(collapsed).toBe(true);
});

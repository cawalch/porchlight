import { test, expect } from "@playwright/test";

/**
 * Card affordance guard.
 *
 * Two checks:
 *   1. Elevation: the card has a non-trivial box-shadow (the card reads as
 *      raised, not flat against the page). Catches the "invisible card" bug
 *      where surface ≈ bg and there's no shadow.
 *   2. Interactive lift: clickable cards lift on hover (translateY) and get a
 *      stronger shadow — the state must be perceptibly different from default.
 */

test("card has visible elevation (non-trivial shadow)", async ({ page }) => {
  await page.goto("./preview/card");
  const card = page.locator(".pl-c-card").first();
  const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
  console.log(`[card] box-shadow=${shadow}`);
  // "none" means no elevation — the card is invisible against the bg.
  expect(shadow, "card must have a box-shadow (elevation)").not.toBe("none");
});

test("interactive card lifts on hover", async ({ page }) => {
  await page.goto("./preview/card");
  const card = page.locator("a.pl-c-card").first();

  const defTransform = await card.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  const defShadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);

  // Hover via the [data-hover] attribute (the selector accepts it, and it's
  // deterministic — real :hover is flaky in headless).
  await card.evaluate((el) => el.setAttribute("data-hover", ""));
  // Wait for the transition to settle.
  await page.waitForTimeout(300);

  const hoverTransform = await card.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  const hoverShadow = await card.evaluate(
    (el) => getComputedStyle(el).boxShadow,
  );

  console.log(
    `[card] default transform=${defTransform} hover transform=${hoverTransform}`,
  );
  console.log(`[card] default shadow=${defShadow} hover shadow=${hoverShadow}`);

  // The lift must change the transform (translateY ≠ none).
  expect(
    hoverTransform,
    "interactive card must lift (transform changes) on hover",
  ).not.toBe(defTransform);
  // And the shadow must intensify (shadow-1 → shadow-2).
  expect(
    hoverShadow,
    "interactive card shadow must intensify on hover",
  ).not.toBe(defShadow);
});

import { test, expect } from "@playwright/test";
import { compositeOver, deltaL } from "./lib/color";

/**
 * Data table affordance guard.
 *
 * Two checks:
 *   1. Row hover: the hover wash must be perceptibly distinct from the default
 *      row bg (catches an invisible hover if surface-2 ever drifts too close).
 *   2. Sticky header: the header has an opaque background so scrolling rows
 *      don't show through (catches a transparent header bug).
 */

const HOVER_DL = 0.02; // hover wash must shift ≥2% lightness (rows are subtle)

test("table row hover is perceptibly distinct", async ({ page }) => {
  await page.goto("./preview/data-table");
  const row = page.locator(".c-table tbody tr").nth(1); // skip the selected first row
  const surface = await page
    .locator(".c-table-wrap")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  const defColor = await row.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await row.hover();
  await page.waitForTimeout(200); // let the bg transition settle
  const hoverColor = await row.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  // Composite over the surface — default row bg is transparent, so judge what
  // the eye actually sees against the wrap background.
  const dl = deltaL(
    compositeOver(hoverColor, surface),
    compositeOver(defColor, surface),
  );
  console.log(
    `[table] row def=${defColor} hover=${hoverColor} surface=${surface} ΔL=${dl.toFixed(4)}`,
  );
  expect(
    dl,
    `row hover must differ from default by ≥ ${HOVER_DL}`,
  ).toBeGreaterThanOrEqual(HOVER_DL);
});

test("sticky header has an opaque background", async ({ page }) => {
  await page.goto("./preview/data-table");
  const bg = await page.evaluate(() => {
    const th = document.querySelector(".c-table th") as HTMLElement;
    return getComputedStyle(th).backgroundColor;
  });
  console.log(`[table] header bg=${bg}`);
  // Must be opaque — scrolling rows would show through a transparent header.
  expect(bg, "header bg must not be transparent").not.toMatch(
    /rgba?\([^)]*,\s*0\s*\)/,
  );
  expect(bg, "header bg must not be transparent").not.toBe("transparent");
});

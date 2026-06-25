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
const SELECTED_DL = 0.03; // selected rows should be more prominent than hover

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

test("table selected row is perceptibly distinct and carries an accent bar", async ({
  page,
}) => {
  await page.goto("./preview/data-table");
  const states = await page.evaluate(() => {
    const wrap = document.querySelector(".c-table-wrap") as HTMLElement;
    const selected = document.querySelector(
      ".c-table tbody tr[aria-selected='true']",
    ) as HTMLElement;
    const unselected = document.querySelector(
      ".c-table tbody tr:not([aria-selected='true']):not(.c-table__detail)",
    ) as HTMLElement;
    if (!wrap || !selected || !unselected) return null;
    const selectedStyle = getComputedStyle(selected);
    return {
      accentBar: selectedStyle.boxShadow,
      selectedBg: selectedStyle.backgroundColor,
      surface: getComputedStyle(wrap).backgroundColor,
      unselectedBg: getComputedStyle(unselected).backgroundColor,
    };
  });

  console.log("[table-selected]", states);

  expect(states).not.toBeNull();
  const dl = deltaL(
    compositeOver(states!.selectedBg, states!.surface),
    compositeOver(states!.unselectedBg, states!.surface),
  );
  expect(
    dl,
    `selected row must differ from unselected by ≥ ${SELECTED_DL}`,
  ).toBeGreaterThanOrEqual(SELECTED_DL);
  expect(states!.accentBar).toContain("inset");
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

test("collapsed detail rows do not expose detail content", async ({ page }) => {
  await page.goto("./preview/data-table");
  const metrics = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        ".c-table__detail:not([open]):not([data-open])",
      ),
    ].map((row) => {
        const inner = row.querySelector(
          ".c-table__detail-inner",
        ) as HTMLElement;
        const content = row.querySelector(
          ".c-table__detail-content",
        ) as HTMLElement;
        const innerRect = inner.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const contentStyle = getComputedStyle(content);
        const child = content.firstElementChild as HTMLElement;
        const childStyle = getComputedStyle(child);
        return {
          childVisibility: childStyle.visibility,
          contentHeight: contentRect.height,
          contentVisibility: contentStyle.visibility,
          innerHeight: innerRect.height,
          paddingBlockEnd: contentStyle.paddingBlockEnd,
          paddingBlockStart: contentStyle.paddingBlockStart,
        };
      }),
  );

  expect(
    metrics,
    "preview should include collapsed detail rows",
  ).not.toHaveLength(0);
  for (const metric of metrics) {
    expect(metric.innerHeight).toBe(0);
    expect(metric.contentHeight).toBe(0);
    expect(metric.contentVisibility).toBe("hidden");
    expect(metric.childVisibility).toBe("hidden");
    expect(metric.paddingBlockStart).toBe("0px");
    expect(metric.paddingBlockEnd).toBe("0px");
  }
});

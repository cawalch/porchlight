import { expect, test } from "@playwright/test";

/**
 * .pl-c-split-pane data-collapse="stack" container-query guard.
 *
 * A named container query can only match DESCENDANTS of the named container,
 * never the container element itself - so keying the collapse to the pane's
 * own `container: pl-c-split-pane` was dead code, and only the viewport media
 * query ever fired. The collapse must key to the nearest ANCESTOR query
 * container: a container-type: inline-size wrapper (drawer, tab body, side
 * card) or a porchlight container element. This pins that contract:
 *
 *   1. narrow container + WIDE desktop viewport -> stacked (the regression),
 *   2. wide container + wide desktop viewport   -> side-by-side,
 *   3. no container ancestor                    -> viewport fallback.
 */

interface PaneMetrics {
  columns: number;
  rows: number;
  separatorCursor: string;
  endRowStart: string;
  startBottom: number;
  endTop: number;
  startRight: number;
  endLeft: number;
  width: number;
  viewportWidth: number;
}

declare global {
  interface Window {
    __measureSplitPane: (pageWidthCss: string, useWrapper: boolean) => PaneMetrics;
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__measureSplitPane = (pageWidthCss, useWrapper) => {
      const wrap = document.createElement("div");
      if (useWrapper) {
        wrap.style.containerType = "inline-size";
      }
      wrap.style.width = pageWidthCss;
      wrap.style.margin = "0";
      const pane = document.createElement("div");
      pane.className = "pl-c-split-pane";
      pane.setAttribute("data-orientation", "horizontal");
      pane.setAttribute("data-collapse", "stack");
      pane.setAttribute("aria-label", "test split pane");
      pane.innerHTML =
        '<section class="pl-c-split-pane__pane pl-c-split-pane__pane--start"></section>' +
        '<div class="pl-c-split-pane__separator" role="separator" aria-orientation="vertical"></div>' +
        '<section class="pl-c-split-pane__pane pl-c-split-pane__pane--end"></section>';
      wrap.appendChild(pane);
      document.body.appendChild(wrap);
      try {
        const cs = getComputedStyle(pane);
        const start = pane.querySelector<HTMLElement>(
          ".pl-c-split-pane__pane--start",
        )!;
        const end = pane.querySelector<HTMLElement>(
          ".pl-c-split-pane__pane--end",
        )!;
        const sep = pane.querySelector<HTMLElement>(
          ".pl-c-split-pane__separator",
        )!;
        const startRect = start.getBoundingClientRect();
        const endRect = end.getBoundingClientRect();
        return {
          columns: cs.gridTemplateColumns.trim().split(/\s+/).length,
          rows: cs.gridTemplateRows.trim().split(/\s+/).length,
          separatorCursor: getComputedStyle(sep).cursor,
          endRowStart: getComputedStyle(end).gridRowStart,
          startBottom: startRect.bottom,
          endTop: endRect.top,
          startRight: startRect.right,
          endLeft: endRect.left,
          width: pane.getBoundingClientRect().width,
          viewportWidth: innerWidth,
        };
      } finally {
        wrap.remove();
      }
    };
  });
});

test("data-collapse=stack stacks inside a narrow container on a wide desktop viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./preview/split-pane");
  // 30rem = 480px, below the 42rem (672px) collapse breakpoint.
  const m = await page.evaluate(() => window.__measureSplitPane("30rem", true));

  // The regression context: genuinely narrow container, wide desktop.
  expect(m.viewportWidth).toBe(1280);
  expect(m.width).toBeGreaterThan(460);
  expect(m.width).toBeLessThan(42 * 16);

  // Stacked: one column, three rows (start / separator / end), horizontal
  // separator with a row-resize affordance.
  expect(m.columns).toBe(1);
  expect(m.rows).toBe(3);
  expect(m.separatorCursor).toBe("row-resize");
  expect(m.endRowStart).toBe("3");
  // Geometric: end pane sits below the start pane, not beside it.
  expect(m.startBottom).toBeLessThanOrEqual(m.endTop + 1);
});

test("data-collapse=stack stays side-by-side inside a wide container on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./preview/split-pane");
  // 50rem = 800px, above the 42rem (672px) collapse breakpoint.
  const m = await page.evaluate(() => window.__measureSplitPane("50rem", true));

  expect(m.width).toBeGreaterThan(42 * 16);
  expect(m.columns).toBe(3);
  expect(m.rows).toBe(1);
  expect(m.separatorCursor).toBe("col-resize");
  expect(m.endRowStart).toBe("1");
  // Geometric: end pane sits to the right of the start pane.
  expect(m.endLeft).toBeGreaterThan(m.startRight);
});

test("data-collapse=stack falls back to the viewport without a container ancestor", async ({
  page,
}) => {
  await page.goto("./preview/split-pane");
  // No container-type wrapper: the query has no ancestor container, so the
  // viewport is the fallback context (and the media query agrees).
  await page.setViewportSize({ width: 1280, height: 900 });
  const wide = await page.evaluate(() => window.__measureSplitPane("100%", false));
  expect(wide.columns).toBe(3);
  expect(wide.rows).toBe(1);
  expect(wide.endRowStart).toBe("1");

  await page.setViewportSize({ width: 390, height: 844 });
  const narrow = await page.evaluate(() => window.__measureSplitPane("100%", false));
  expect(narrow.columns).toBe(1);
  expect(narrow.rows).toBe(3);
  expect(narrow.endRowStart).toBe("3");
});

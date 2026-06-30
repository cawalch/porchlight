import { expect, type Page, test } from "@playwright/test";
import sharp from "sharp";

interface TooltipMetrics {
  body: Rect;
  bodyDisplay: string;
  bodyOpacity: number;
  gapAbove: number;
  gapBelow: number;
  overlaps: boolean;
  position: string;
  trigger: Rect;
  viewport: {
    height: number;
    width: number;
  };
}

interface Rect {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

async function tooltipMetrics(page: Page, id: string): Promise<TooltipMetrics> {
  return page.evaluate((id) => {
    const body = document.getElementById(id);
    const trigger = body
      ?.closest(".c-tooltip")
      ?.querySelector(".c-tooltip__trigger");
    if (!body || !trigger) {
      throw new Error(`Tooltip ${id} is missing its trigger or body`);
    }

    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return {
        bottom: box.bottom,
        height: box.height,
        left: box.left,
        right: box.right,
        top: box.top,
        width: box.width,
      };
    };
    const triggerBox = rect(trigger);
    const bodyBox = rect(body);
    const style = getComputedStyle(body);

    return {
      body: bodyBox,
      bodyDisplay: style.display,
      bodyOpacity: Number(style.opacity),
      gapAbove: triggerBox.top - bodyBox.bottom,
      gapBelow: bodyBox.top - triggerBox.bottom,
      overlaps: !(
        bodyBox.right <= triggerBox.left ||
        bodyBox.left >= triggerBox.right ||
        bodyBox.bottom <= triggerBox.top ||
        bodyBox.top >= triggerBox.bottom
      ),
      position: style.position,
      trigger: triggerBox,
      viewport: {
        height: window.innerHeight,
        width: window.innerWidth,
      },
    };
  }, id);
}

const samplePagePixel = async (page: Page, point: { x: number; y: number }) => {
  const buffer = await page.screenshot({
    clip: {
      x: Math.round(point.x),
      y: Math.round(point.y),
      width: 1,
      height: 1,
    },
    scale: "css",
  });
  const { data } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  return data;
};

function expectTooltipFillPixel(pixel: Uint8Array): void {
  expect(pixel[0]).toBeLessThan(80);
  expect(pixel[1]).toBeLessThan(80);
  expect(pixel[2]).toBeLessThan(80);
}

async function tabToButton(page: Page, name: string): Promise<void> {
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press("Tab");
    const isFocused = await page.evaluate((name) => {
      const active = document.activeElement;
      return (
        active?.tagName === "BUTTON" && active.textContent?.trim() === name
      );
    }, name);
    if (isFocused) return;
  }

  throw new Error(`Could not keyboard-focus button "${name}"`);
}

function expectVisibleWithoutOverlap(metrics: TooltipMetrics): void {
  expect(metrics.bodyDisplay).toBe("block");
  expect(metrics.bodyOpacity).toBeGreaterThan(0.98);
  expect(metrics.position).toBe("fixed");
  expect(metrics.overlaps).toBe(false);
  expect(Math.max(metrics.gapAbove, metrics.gapBelow)).toBeGreaterThanOrEqual(
    7,
  );
}

function expectWithinViewport(metrics: TooltipMetrics): void {
  expect(metrics.body.left).toBeGreaterThanOrEqual(7);
  expect(metrics.body.top).toBeGreaterThanOrEqual(7);
  expect(metrics.body.right).toBeLessThanOrEqual(metrics.viewport.width - 7);
  expect(metrics.body.bottom).toBeLessThanOrEqual(metrics.viewport.height - 7);
}

async function installEdgeFixtures(page: Page): Promise<void> {
  await page.evaluate(() => {
    const buttonBlock = 40;
    const centerX = window.innerWidth / 2 - 70;
    const centerY = window.innerHeight / 2 - buttonBlock / 2;
    const bottomY = window.innerHeight - buttonBlock - 8;
    const rightX = window.innerWidth - 132;
    const fixtures = document.createElement("div");
    fixtures.setAttribute("data-testid", "tooltip-edge-fixtures");
    fixtures.style.cssText =
      "position: absolute; inset: 0; z-index: 2147483647;";
    fixtures.innerHTML = `
      <div style="position: absolute; inset-block-start: 8px; inset-inline-start: ${centerX}px;">
        <span class="c-tooltip" style="--c-tooltip-anchor: --edge-top;">
          <span class="c-tooltip__trigger">
            <button class="c-button" aria-describedby="edge-top-tip">Top edge</button>
          </span>
          <span class="c-tooltip__body" role="tooltip" id="edge-top-tip">Tooltip near the top edge</span>
        </span>
      </div>
      <div style="position: absolute; inset-block-start: ${bottomY}px; inset-inline-start: ${centerX}px;">
        <span class="c-tooltip" style="--c-tooltip-anchor: --edge-bottom;">
          <span class="c-tooltip__trigger">
            <button class="c-button" aria-describedby="edge-bottom-tip">Bottom edge</button>
          </span>
          <span class="c-tooltip__body" role="tooltip" id="edge-bottom-tip">Tooltip near the bottom edge</span>
        </span>
      </div>
      <div style="position: absolute; inset-block-start: ${centerY}px; inset-inline-start: 8px;">
        <span class="c-tooltip" style="--c-tooltip-anchor: --edge-left;">
          <span class="c-tooltip__trigger">
            <button class="c-button" aria-describedby="edge-left-tip">Left edge</button>
          </span>
          <span class="c-tooltip__body" role="tooltip" id="edge-left-tip">Tooltip near the left edge</span>
        </span>
      </div>
      <div style="position: absolute; inset-block-start: ${centerY}px; inset-inline-start: ${rightX}px;">
        <span class="c-tooltip" style="--c-tooltip-anchor: --edge-right;">
          <span class="c-tooltip__trigger">
            <button class="c-button" aria-describedby="edge-right-tip">Right edge</button>
          </span>
          <span class="c-tooltip__body" role="tooltip" id="edge-right-tip">Tooltip near the right edge</span>
        </span>
      </div>
    `;
    document.body.append(fixtures);
  });
}

async function installNestedFixtures(page: Page): Promise<void> {
  await page.evaluate(() => {
    const fixtures = document.createElement("div");
    fixtures.setAttribute("data-testid", "tooltip-nested-fixtures");
    fixtures.style.cssText =
      "position: absolute; inset: 0; z-index: 2147483647;";
    fixtures.innerHTML = `
      <div
        data-testid="tooltip-clip-panel"
        style="
          position: absolute;
          inset-block-start: 360px;
          inset-inline-start: 420px;
          inline-size: 320px;
          block-size: 58px;
          overflow: hidden;
          border: 1px solid currentColor;
          background: Canvas;
        "
      >
        <div style="padding: 8px 12px;">
          <span class="c-tooltip" style="--c-tooltip-anchor: --nested-clipped;">
            <span class="c-tooltip__trigger">
              <button class="c-button" aria-describedby="nested-clipped-tip">Nested clipped</button>
            </span>
            <span class="c-tooltip__body" role="tooltip" id="nested-clipped-tip">Tooltip escapes clipped panel</span>
          </span>
        </div>
      </div>

      <div
        data-testid="tooltip-cover"
        style="
          position: fixed;
          inset-block-start: 304px;
          inset-inline-start: 400px;
          inline-size: 360px;
          block-size: 56px;
          z-index: calc(var(--pl-z-overlay) - 1);
          background: rgb(255 0 255);
        "
      ></div>
    `;
    document.body.append(fixtures);
  });
}

test("tooltip hover clears the trigger", async ({ page }) => {
  await page.goto("./preview/tooltip");

  await page.getByRole("button", { name: "Hover me" }).hover();
  await page.waitForTimeout(250);

  expectVisibleWithoutOverlap(await tooltipMetrics(page, "tip-1"));
});

test("tooltip shows for keyboard focus inside the trigger", async ({
  page,
}) => {
  await page.goto("./preview/tooltip");

  await tabToButton(page, "Hover me");
  await page.waitForTimeout(250);

  expectVisibleWithoutOverlap(await tooltipMetrics(page, "tip-1"));
});

test("tooltip placement adapts at viewport edges", async ({ page }) => {
  await page.goto("./preview/tooltip");
  await installEdgeFixtures(page);

  const cases = [
    {
      button: "Top edge",
      id: "edge-top-tip",
      side: "below",
    },
    {
      button: "Bottom edge",
      id: "edge-bottom-tip",
      side: "above",
    },
    {
      button: "Left edge",
      id: "edge-left-tip",
      side: "above",
    },
    {
      button: "Right edge",
      id: "edge-right-tip",
      side: "above",
    },
  ] as const;

  for (const item of cases) {
    await page.getByRole("button", { name: item.button }).hover();
    await page.waitForTimeout(250);

    const metrics = await tooltipMetrics(page, item.id);
    expectVisibleWithoutOverlap(metrics);
    expectWithinViewport(metrics);

    if (item.side === "below") {
      expect(metrics.gapBelow).toBeGreaterThanOrEqual(7);
    } else {
      expect(metrics.gapAbove).toBeGreaterThanOrEqual(7);
    }
  }
});

test("tooltip escapes nested overflow and paints above nearby layers", async ({
  page,
}) => {
  await page.goto("./preview/tooltip");
  await installNestedFixtures(page);

  await page.getByRole("button", { name: "Nested clipped" }).hover();
  await page.waitForTimeout(250);

  const metrics = await tooltipMetrics(page, "nested-clipped-tip");
  const panel = await page
    .getByTestId("tooltip-clip-panel")
    .evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        bottom: box.bottom,
        top: box.top,
      };
    });

  expectVisibleWithoutOverlap(metrics);
  expectWithinViewport(metrics);
  expect(metrics.body.top).toBeLessThan(panel.top);

  const fillPixel = await samplePagePixel(page, {
    x: metrics.body.right - 10,
    y: metrics.body.top + metrics.body.height / 2,
  });
  expectTooltipFillPixel(fillPixel);
});

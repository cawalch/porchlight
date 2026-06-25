import { test, expect } from "@playwright/test";

type Rect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const closedSurfacePages = [
  { path: "popover-menu", selector: ".c-menu__popover[popover]" },
  { path: "dropdown", selector: ".c-dropdown__menu[popover]" },
  { path: "split-button", selector: ".c-split__menu[popover]" },
  { path: "command-palette", selector: ".c-command[popover]" },
  { path: "drawer", selector: ".c-drawer[popover]" },
  { path: "dialog", selector: "dialog.c-dialog" },
] as const;

const isZeroRect = (rect: Rect) =>
  rect.width === 0 && rect.height === 0 && rect.x === 0 && rect.y === 0;

test("accordion closed panels do not expose panel content", async ({
  page,
}) => {
  await page.goto("./preview/accordion");

  const metrics = await page.evaluate(() => {
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { height: r.height, width: r.width, x: r.x, y: r.y };
    };

    return [...document.querySelectorAll(".c-accordion__item")].map((item) => {
      const panel = item.querySelector(".c-accordion__panel") as HTMLElement;
      const content = item.querySelector(
        ".c-accordion__content",
      ) as HTMLElement;
      const panelStyle = getComputedStyle(panel);
      const contentStyle = getComputedStyle(content);
      return {
        contentRect: rect(content),
        contentVisibility: contentStyle.visibility,
        open: item.hasAttribute("open"),
        panelOverflow: panelStyle.overflow,
        panelRect: rect(panel),
      };
    });
  });

  const closed = metrics.filter((metric) => !metric.open);
  expect(
    closed,
    "preview should include closed accordion panels",
  ).not.toHaveLength(0);

  for (const metric of closed) {
    expect(metric.panelRect.height).toBeLessThanOrEqual(0.5);
    expect(metric.panelOverflow).toBe("hidden");
    expect(metric.contentVisibility).toBe("hidden");
  }

  const open = metrics.filter((metric) => metric.open);
  expect(
    open,
    "preview should include an open accordion panel",
  ).not.toHaveLength(0);
  for (const metric of open) {
    expect(metric.contentRect.height).toBeGreaterThan(0);
    expect(metric.contentVisibility).toBe("visible");
  }
});

test("hidden tab panels are removed from layout", async ({ page }) => {
  await page.goto("./preview/tabs");

  const panels = await page.evaluate(() => {
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { height: r.height, width: r.width, x: r.x, y: r.y };
    };

    return [...document.querySelectorAll(".c-tabs__panel")].map((panel) => {
      const style = getComputedStyle(panel);
      return {
        display: style.display,
        hidden: panel.hasAttribute("hidden"),
        id: panel.id,
        rect: rect(panel),
      };
    });
  });

  const hiddenPanels = panels.filter((panel) => panel.hidden);
  expect(
    hiddenPanels,
    "preview should include hidden tab panels",
  ).not.toHaveLength(0);
  for (const panel of hiddenPanels) {
    expect(panel.display).toBe("none");
    expect(isZeroRect(panel.rect)).toBe(true);
  }

  const visiblePanels = panels.filter((panel) => !panel.hidden);
  expect(
    visiblePanels,
    "preview should include visible tab panels",
  ).not.toHaveLength(0);
  for (const panel of visiblePanels) {
    expect(panel.display).not.toBe("none");
    expect(panel.rect.height).toBeGreaterThan(0);
  }
});

for (const { path, selector } of closedSurfacePages) {
  test(`closed ${path} top-layer surfaces are removed from layout`, async ({
    page,
  }) => {
    await page.goto(`./preview/${path}`);

    const surfaces = await page.evaluate((selector) => {
      const rect = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { height: r.height, width: r.width, x: r.x, y: r.y };
      };

      return [...document.querySelectorAll(selector)].map((surface) => {
        const style = getComputedStyle(surface);
        return {
          display: style.display,
          id: surface.id,
          open:
            surface instanceof HTMLDialogElement
              ? surface.open
              : surface.matches(":popover-open"),
          opacity: style.opacity,
          rect: rect(surface),
        };
      });
    }, selector);

    expect(surfaces, `${path} should include closed surfaces`).not.toHaveLength(
      0,
    );

    for (const surface of surfaces) {
      expect(surface.open).toBe(false);
      expect(surface.display).toBe("none");
      expect(surface.opacity).toBe("0");
      expect(isZeroRect(surface.rect)).toBe(true);
    }
  });
}

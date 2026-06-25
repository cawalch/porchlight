import { expect, test } from "@playwright/test";

const appSurfacePages = [
  { path: "./preview/app-dashboard", heading: "Dashboard" },
  { path: "./preview/app-cases", heading: "Cases" },
  { path: "./preview/app-siem", heading: "Security Operations" },
] as const;

const narrowDesktopPages = [
  { path: "./preview/app-dashboard", ready: "role", heading: "Dashboard" },
  { path: "./preview/app-cases", ready: "role", heading: "Cases" },
  {
    path: "./preview/app-siem",
    ready: "role",
    heading: "Security Operations",
  },
  { path: "./preview/app-dense", ready: "selector", selector: ".dense-app" },
  { path: "./preview/app-shell", ready: "role", heading: "App shell" },
] as const;

const overlayPages = [
  {
    path: "./preview/popover-menu",
    heading: "Popover menu",
    triggerName: "Account",
    surface: "#account-menu",
  },
  {
    path: "./preview/dropdown",
    heading: "Dropdown",
    triggerName: "Select a project",
    surface: "#dd-1",
  },
  {
    path: "./preview/split-button",
    heading: "Split button",
    triggerName: "More new options",
    surface: "#sb-1",
  },
  {
    path: "./preview/command-palette",
    heading: "Command palette",
    triggerName: "Open command palette",
    surface: "#cmdk",
  },
  {
    path: "./preview/drawer",
    heading: "Drawer",
    triggerName: "Open end drawer",
    surface: "#drawer-end",
  },
  {
    path: "./preview/dialog",
    heading: "Dialog",
    triggerName: "Delete account",
    surface: "#confirm-dialog",
  },
] as const;

async function reach(page: import("@playwright/test").Page, heading: string) {
  await expect(
    page.getByRole("heading", { name: heading, exact: true }),
  ).toBeVisible();
}

async function reachPreview(
  page: import("@playwright/test").Page,
  preview: (typeof narrowDesktopPages)[number],
) {
  if (preview.ready === "selector") {
    await expect(page.locator(preview.selector)).toBeVisible();
    return;
  }

  await reach(page, preview.heading);
}

test.describe("modern desktop app polish", () => {
  for (const appPage of appSurfacePages) {
    test(`${appPage.path} uses app-surface card radii`, async ({ page }) => {
      await page.goto(appPage.path);
      await reach(page, appPage.heading);

      const cards = page.locator(".l-app-shell .c-card");
      expect(
        await cards.count(),
        "app preview should render cards",
      ).toBeGreaterThan(0);

      const oversized = await cards.evaluateAll((elements) =>
        elements
          .map((element, index) => {
            const radius = parseFloat(
              getComputedStyle(element).borderTopLeftRadius,
            );
            return {
              hasAppSurface: element.getAttribute("data-surface") === "app",
              index,
              radius,
            };
          })
          .filter((card) => !card.hasAppSurface || card.radius > 16),
      );

      expect(
        oversized,
        "operational app cards should use the tighter app surface treatment",
      ).toEqual([]);
    });
  }

  for (const width of [1280, 1024, 900, 768]) {
    test(`app previews avoid page-level horizontal overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 820 });

      for (const appPage of narrowDesktopPages) {
        await page.goto(appPage.path);
        await reachPreview(page, appPage);

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });

        expect(
          overflow,
          `${appPage.path} should keep overflow inside component scrollers`,
        ).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe("open top-layer surfaces", () => {
  for (const width of [1024, 768]) {
    for (const theme of ["light", "dark"] as const) {
      test(`overlays stay in-bounds at ${width}px in ${theme} mode`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 820 });

        for (const overlayPage of overlayPages) {
          await page.goto(overlayPage.path);
          await reach(page, overlayPage.heading);
          await page.evaluate((nextTheme) => {
            document.documentElement.setAttribute("data-theme", nextTheme);
          }, theme);

          const trigger = page.getByRole("button", {
            exact: true,
            name: overlayPage.triggerName,
          });
          expect(
            await trigger.count(),
            `${overlayPage.path} should have one opener`,
          ).toBe(1);
          await trigger.click();
          const surface = page.locator(overlayPage.surface).first();
          await expect(surface).toBeVisible();
          await page.waitForTimeout(350);

          const state = await surface.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              bottom: rect.bottom,
              display: style.display,
              height: rect.height,
              left: rect.left,
              open:
                element instanceof HTMLDialogElement
                  ? element.open
                  : element.matches(":popover-open"),
              right: rect.right,
              top: rect.top,
              width: rect.width,
              viewportHeight: window.innerHeight,
              viewportWidth: window.innerWidth,
            };
          });

          expect(state.open, `${overlayPage.path} should be open`).toBe(true);
          expect(
            state.display,
            `${overlayPage.path} should be displayed`,
          ).not.toBe("none");
          expect(
            state.width,
            `${overlayPage.path} should have width`,
          ).toBeGreaterThan(0);
          expect(
            state.height,
            `${overlayPage.path} should have height`,
          ).toBeGreaterThan(0);
          expect(
            state.left,
            `${overlayPage.path} should not escape left`,
          ).toBeGreaterThanOrEqual(-1);
          expect(
            state.top,
            `${overlayPage.path} should not escape top`,
          ).toBeGreaterThanOrEqual(-1);
          expect(
            state.right,
            `${overlayPage.path} should not escape right`,
          ).toBeLessThanOrEqual(state.viewportWidth + 1);
          expect(
            state.bottom,
            `${overlayPage.path} should not escape bottom`,
          ).toBeLessThanOrEqual(state.viewportHeight + 1);
        }
      });
    }
  }

  test("borderless overlay surfaces restore borders in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });

    for (const overlayPage of overlayPages.filter(({ surface }) =>
      ["#cmdk", "#drawer-end", "#confirm-dialog"].includes(surface),
    )) {
      await page.goto(overlayPage.path);
      await reach(page, overlayPage.heading);
      const trigger = page.getByRole("button", {
        exact: true,
        name: overlayPage.triggerName,
      });
      expect(
        await trigger.count(),
        `${overlayPage.path} should have one opener`,
      ).toBe(1);
      await trigger.click();
      const surface = page.locator(overlayPage.surface).first();
      await expect(surface).toBeVisible();
      await page.waitForTimeout(350);

      const border = await surface.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.borderTopColor,
          style: style.borderTopStyle,
          width: style.borderTopWidth,
        };
      });

      expect(border.width, `${overlayPage.path} should draw a border`).not.toBe(
        "0px",
      );
      expect(border.style, `${overlayPage.path} border should be solid`).toBe(
        "solid",
      );
    }
  });
});

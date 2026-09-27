import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test.describe(`sample spacing at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const route of [
      "app-list-detail",
      "app-process-builder",
      "app-reporting-dashboard",
    ]) {
      test(`${route} uses a single gap after its page heading`, async ({
        page,
      }) => {
        await page.goto(`preview/${route}`);
        const heading = page.locator(".pl-l-stack > .pl-c-page-header");
        const spacing = await heading.evaluate((el) => {
          const next = el.nextElementSibling!;
          return {
            actual:
              next.getBoundingClientRect().top -
              el.getBoundingClientRect().bottom,
            gap: Number.parseFloat(getComputedStyle(el.parentElement!).rowGap),
          };
        });
        expect(spacing.actual).toBeCloseTo(spacing.gap, 0);
        await expect(heading.locator(".pl-c-page-header__subtitle")).toHaveCSS(
          "margin-bottom",
          "0px",
        );
      });
    }

    test("reporting starts at the page content inset", async ({ page }) => {
      await page.goto("preview/app-reporting-dashboard");
      const inset = await page.locator(".reporting-shell").evaluate((el) => {
        return (
          el.firstElementChild!.getBoundingClientRect().top -
          el.getBoundingClientRect().top
        );
      });
      expect(inset).toBeCloseTo(0, 0);
    });

    test("marketing hero keeps gutters and centers its actions", async ({
      page,
    }) => {
      await page.goto("preview/app-marketing");
      const geometry = await page
        .locator(".hero-bleed")
        .first()
        .evaluate((el) => {
          const hero = el.getBoundingClientRect();
          const inner = el.firstElementChild!.getBoundingClientRect();
          const buttons = [...el.querySelectorAll(".pl-l-cluster > *")].map(
            (e) => e.getBoundingClientRect(),
          );
          return {
            left: inner.left - hero.left,
            right: hero.right - inner.right,
            center:
              (buttons[0].left + buttons.at(-1)!.right) / 2 -
              (hero.left + hero.right) / 2,
          };
        });
      expect(geometry.left).toBeGreaterThanOrEqual(16);
      expect(geometry.right).toBeGreaterThanOrEqual(16);
      expect(Math.abs(geometry.center)).toBeLessThan(1);
    });

    test("queue metadata has separation and aligned labels and values", async ({
      page,
    }) => {
      await page.goto("preview/app-queue-triage");
      const metadata = page.locator("dl");
      const geometry = await metadata.evaluate((el) => ({
        gap:
          el.getBoundingClientRect().top -
          el.previousElementSibling!.getBoundingClientRect().bottom,
        indents: [...el.querySelectorAll("dd")].map(
          (dd) =>
            dd.getBoundingClientRect().left -
            dd.previousElementSibling!.getBoundingClientRect().left,
        ),
      }));
      expect(geometry.gap).toBe(16);
      expect(geometry.indents).toEqual([0, 0, 0, 0]);
    });

    test("settings separates alert and tabs without extra storage padding", async ({
      page,
    }) => {
      await page.goto("preview/settings");
      const gap = await page
        .locator(".settings-main > .pl-c-tabs")
        .evaluate(
          (el) =>
            el.getBoundingClientRect().top -
            el.previousElementSibling!.getBoundingClientRect().bottom,
        );
      expect(gap).toBe(16);
      const storage = page.locator(".pl-c-card").filter({
        has: page.getByRole("heading", { name: "Storage", exact: true }),
      });
      await expect(storage.locator("p")).toHaveCSS("margin-bottom", "0px");
    });

    test("app shell toggle retains padding beside its hint", async ({
      page,
    }) => {
      await page.goto("preview/app-shell");
      const padding = await page
        .locator("[data-toggle='collapse']")
        .evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          const button = el.getBoundingClientRect();
          return {
            left: text.left - button.left,
            right: button.right - text.right,
            expected: Number.parseFloat(
              getComputedStyle(el).paddingInlineStart,
            ),
          };
        });
      expect(padding.left).toBeGreaterThanOrEqual(padding.expected);
      expect(padding.right).toBeGreaterThanOrEqual(padding.expected);
    });

    for (const [route, selector] of [
      ["app-inbox", ".msg-detail__header h2"],
      ["app-shell", ".main__header h2"],
      ["app-dashboard", ".dash-header p"],
      ["app-cases", ".cases-header p"],
    ]) {
      test(`${route} keeps prose margins out of composed headers`, async ({
        page,
      }) => {
        await page.goto(`preview/${route}`);
        await expect(page.locator(selector)).toHaveCSS("margin-top", "0px");
        await expect(page.locator(selector)).toHaveCSS("margin-bottom", "0px");
      });
    }
  });
}

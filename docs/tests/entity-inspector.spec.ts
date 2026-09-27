import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("independent native invokers, keyboard focus, dismissal and nonmodal actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("./preview/entity-inspector");
  const first = page.getByRole("button", {
    name: "Payroll production",
    exact: true,
  });
  const second = page.getByRole("button", {
    name: "Design workstation",
    exact: true,
  });
  await first.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "Payroll production" });
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute("aria-modal", "true");
  await expect(
    page.getByRole("button", { name: "Close Payroll production" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    panel.getByRole("button", { name: "Mark reviewed" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(first).toBeFocused();
  await second.click();
  const other = page.getByRole("dialog", { name: "Design workstation" });
  const triggerBox = (await second.boundingBox())!;
  const panelBox = (await other.boundingBox())!;
  expect(Math.abs(panelBox.x - triggerBox.x)).toBeLessThan(20);
  await expect(panel).not.toBeVisible();
  await page
    .getByRole("heading", { name: "Entity inspector", exact: true })
    .click();
  await expect(other).not.toBeVisible();
});

for (const density of ["compact", "comfortable", "touch"]) {
  test(`table-contained inspector fits mobile long content, RTL and ${density}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./preview/app-asset-inventory");
    await page.locator("html").evaluate((el, mode) => {
      el.dataset.plDensity = mode;
      el.dataset.plTheme = "dark";
      el.setAttribute("dir", "rtl");
    }, density);
    const trigger = page.getByRole("button", {
      name: "Payroll production",
      exact: true,
    });
    await trigger.click();
    const panel = page.locator("#inspect-AST-1042");
    await panel.evaluate((el) => {
      el.querySelector(".pl-c-inspector__title")!.textContent =
        `A very long asset name with an unbroken identifier ${"a".repeat(80)}`;
      el.querySelector(".pl-c-inspector__actions a")!.textContent =
        "Contact the international asset management owner for this record";
      el.querySelector(".pl-c-inspector__body p")!.textContent =
        "Long incident context. ".repeat(90);
    });
    const metrics = await panel.evaluate((el) => ({
      rect: el.getBoundingClientRect().toJSON(),
      width: el.scrollWidth,
      client: el.clientWidth,
      height: el.scrollHeight,
      clientHeight: el.clientHeight,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(metrics.rect.x).toBeGreaterThanOrEqual(16);
    expect(metrics.rect.right).toBeLessThanOrEqual(metrics.viewportWidth - 16);
    expect(metrics.rect.top).toBeGreaterThanOrEqual(0);
    expect(metrics.rect.bottom).toBeLessThanOrEqual(844);
    expect(metrics.width).toBeLessThanOrEqual(metrics.client);
    expect(metrics.height).toBeGreaterThan(metrics.clientHeight);
    await panel.getByRole("button", { name: "Mark reviewed" }).click();
    await expect(panel.getByRole("status")).toContainText("Review recorded");
    await expect(
      page.locator('[data-asset-id="AST-1042"] [data-review-state]'),
    ).toHaveText("Reviewed");
    await expect(
      panel.getByRole("button", { name: "Reviewed" }),
    ).toBeDisabled();
  });
}

test("gallery navigation initializes inventory actions and preserves sample spacing", async ({
  page,
}) => {
  await page.goto("./preview/");
  await page.getByRole("link", { name: /Asset Inventory/ }).click();
  await expect(
    page.getByRole("heading", { name: "Asset inventory", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  await page
    .getByRole("searchbox", { name: "Find an asset or owner" })
    .fill("Mina");
  await expect(page.locator("#asset-count")).toHaveText("1 assets shown");
  await expect(page.locator("tbody tr:visible")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Payroll production", exact: true })
    .click();
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(
    page.locator('[data-asset-id="AST-1042"] [data-review-state]'),
  ).toHaveText("Reviewed");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Payroll production", exact: true }),
  ).toBeFocused();
  const layout = await page
    .locator(".inventory .pl-l-app-shell__main")
    .evaluate((el) => {
      const style = getComputedStyle(el);
      const heading = el.querySelector("#assets-title")!;
      return {
        padding: parseFloat(style.paddingInlineStart),
        titleOffset:
          heading.getBoundingClientRect().top -
          heading.parentElement!.getBoundingClientRect().top,
      };
    });
  expect(layout.padding).toBeGreaterThanOrEqual(16);
  expect(layout.titleOffset).toBeLessThanOrEqual(1);
});

test("forced colors, reduced motion and centered fallback remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("./preview/entity-inspector");
  await page
    .getByRole("button", { name: "Payroll production", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "Payroll production" });
  await expect(panel).toHaveCSS("border-top-style", "solid");
  expect(
    await panel.evaluate((el) =>
      parseFloat(getComputedStyle(el).transitionDuration),
    ),
  ).toBeLessThanOrEqual(0.001);
  expect(
    (
      await new AxeBuilder({ page })
        .include(".pl-c-inspector:popover-open")
        .analyze()
    ).violations,
  ).toEqual([]);
  await panel.evaluate((el: HTMLElement) => {
    el.style.setProperty("position-area", "none");
    el.style.setProperty("position-anchor", "none");
    el.style.inset = "16px";
    el.style.margin = "auto";
  });
  const rect = (await panel.boundingBox())!;
  expect(Math.abs(rect.x + rect.width / 2 - 640)).toBeLessThan(2);
});

test("top-layer inspector follows its invoker inside a nested scrollport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("./preview/entity-inspector");
  await page.evaluate(() => {
    const scroll = document.createElement("div");
    scroll.id = "nested-fixture";
    scroll.style.cssText =
      "position:fixed;inset:100px auto auto 100px;inline-size:500px;block-size:200px;overflow:auto";
    const content = document.createElement("div");
    content.style.cssText = "block-size:700px;padding-block-start:100px";
    content.append(
      document.querySelector('[popovertarget="inspect-AST-1042"]')!,
      document.querySelector("#inspect-AST-1042")!,
    );
    scroll.append(content);
    document.body.append(scroll);
  });
  await page
    .getByRole("button", { name: "Payroll production", exact: true })
    .click();
  const panel = page.locator("#inspect-AST-1042");
  const before = (await panel.boundingBox())!;
  await page.locator("#nested-fixture").evaluate((el) => {
    el.scrollTop = 60;
  });
  await expect
    .poll(async () => before.y - (await panel.boundingBox())!.y)
    .toBeCloseTo(60, 0);
  const after = (await panel.boundingBox())!;
  expect(after.y + after.height).toBeGreaterThan(300);
  await expect(
    panel.getByRole("link", { name: "Contact owner" }),
  ).toBeVisible();
});

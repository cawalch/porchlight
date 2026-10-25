import { test, expect } from "@playwright/test";

test.describe("cross-browser application smoke", () => {
  test("forms and application shell remain usable", async ({ page }) => {
    await page.goto("./preview/app-settings-console");
    await expect(page.locator("#main")).toBeVisible();
    await expect(page.getByRole("textbox").first()).toBeVisible();
  });

  test("dense tables fit without document overflow", async ({ page }) => {
    await page.goto("./preview/app-queue-triage");
    await expect(page.getByRole("table")).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test("native dialog opens and closes", async ({ page }) => {
    await page.goto("./preview/dialog");
    await page.locator("[data-open='confirm-dialog']").click();
    const dialog = page.locator("#confirm-dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("themed fields keep native form behavior", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./preview/field");
    await page.locator("html").evaluate((html) => {
      html.dataset.plTheme = "dark";
    });

    const input = page.getByRole("textbox", { name: "Workspace name" });
    await expect(input).toHaveCSS("border-top-style", "solid");
    await expect(input).toHaveCSS("appearance", "none");
    await input.focus();
    await expect(input).toBeFocused();

    const select = page.getByRole("combobox", { name: "Queue priority" });
    expect(
      await select.evaluate(
        (el: HTMLSelectElement) => el.validity.valueMissing,
      ),
    ).toBe(true);
    await select.selectOption("normal");
    await expect(select).toHaveValue("normal");
    expect(
      await page
        .locator("[data-preview-select]")
        .evaluate((form: HTMLFormElement) =>
          Object.fromEntries(new FormData(form)),
        ),
    ).toEqual({ priority: "normal", policy: "legacy" });
    await page.getByRole("button", { name: "Reset selections" }).click();
    await expect(select).toHaveValue("");
    expect(
      await select.evaluate(
        (el: HTMLSelectElement) => el.validity.valueMissing,
      ),
    ).toBe(true);
  });

  test("dropdown keyboard selection updates its trigger", async ({ page }) => {
    await page.goto("./preview/dropdown");
    const trigger = page.locator("#dd-trigger-1");
    const menu = page.locator("#dd-1");
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      menu.getByRole("menuitemradio", { name: "Project Alpha" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      menu.getByRole("menuitemradio", { name: "Project Beta" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("Project Beta");
  });

  test("record popover stays in the mobile viewport and dismisses", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./preview/entity-inspector");
    const trigger = page.getByRole("button", {
      name: "Payroll production",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const inspector = page.getByRole("dialog", { name: "Payroll production" });
    await expect(inspector).toBeVisible();
    const rect = await inspector.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(844);
    await page.keyboard.press("Escape");
    await expect(inspector).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("wide table scrolls inside its wrapper while its first column stays visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./preview/data-table");
    const wrap = page.locator(".pl-c-table-wrap").first();
    const firstColumn = wrap.locator(".pl-c-table__sticky-col").first();
    await expect(wrap).toBeVisible();
    const initial = await firstColumn.boundingBox();
    expect(initial).not.toBeNull();
    await wrap.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    const scrolled = await firstColumn.boundingBox();
    const wrapper = await wrap.boundingBox();
    expect(scrolled).not.toBeNull();
    expect(wrapper).not.toBeNull();
    expect(scrolled!.x).toBeGreaterThanOrEqual(wrapper!.x - 1);
    expect(scrolled!.x + scrolled!.width).toBeLessThanOrEqual(
      wrapper!.x + wrapper!.width + 1,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
    ).toBe(false);
  });
});

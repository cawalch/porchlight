import { test, expect } from "@playwright/test";

/**
 * Scaffold smoke tests — confirm the site builds and the accessible chrome
 * (skip link, heading, title) is present. Per-component visual + axe suites
 * arrive with the components in Phase 3.
 */
test.describe("docs scaffold", () => {
  test("home renders with a title and heading", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveTitle(/Porchlight/);
    await expect(
      page.getByRole("heading", { name: "Porchlight", level: 1 }),
    ).toBeVisible();
  });

  test("skip link is keyboard-focusable and visible", async ({ page }) => {
    await page.goto("./");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await skip.focus();
    await expect(skip).toBeVisible();
  });

  test("preview gallery page is reachable", async ({ page }) => {
    await page.goto("./preview");
    await expect(
      page.getByRole("heading", { name: "Preview gallery" }),
    ).toBeVisible();
  });

  test("reset preview page renders and lists the layers", async ({ page }) => {
    await page.goto("./preview/reset");
    await expect(page.getByRole("heading", { name: "Reset" })).toBeVisible();
    await expect(page.getByText("porchlight.reset")).toBeVisible();
  });

  test("tokens page lists registered properties and a brand ramp", async ({
    page,
  }) => {
    await page.goto("./preview/tokens");
    await expect(
      page.getByRole("heading", { name: "Primitive tokens" }),
    ).toBeVisible();
    // Registered property name (exact: the value cells also mention it via calc()).
    await expect(
      page.getByText("--pl-motion-scale", { exact: true }),
    ).toBeVisible();
    // A brand primitive rendered as a swatch name.
    await expect(page.getByText("--pl-brand-6", { exact: true })).toBeVisible();
  });

  test("themes playground toggles density and updates the control", async ({
    page,
  }) => {
    await page.goto("./preview/themes");
    await expect(
      page.getByRole("heading", { name: "Themes & density" }),
    ).toBeVisible();
    const playground = page.locator(".playground");
    await expect(playground).toHaveAttribute("data-density", "comfortable");
    // Switch to touch density; the attribute (and thus --pl-control-block-size) changes.
    await page.getByRole("button", { name: "touch" }).click();
    await expect(playground).toHaveAttribute("data-density", "touch");
  });

  test("base page renders the fluid type scale", async ({ page }) => {
    await page.goto("./preview/base");
    await expect(
      page.getByRole("heading", { name: "Base layer", exact: true }),
    ).toBeVisible();
    // The scale lists every text token.
    await expect(page.getByText("--pl-text-xl", { exact: true })).toBeVisible();
    await expect(page.getByText("--pl-text-xs", { exact: true })).toBeVisible();
  });

  test("layout page renders grid widgets and the sidebar collapse", async ({
    page,
  }) => {
    await page.goto("./preview/layout");
    await expect(
      page.getByRole("heading", { name: "Layout primitives", exact: true }),
    ).toBeVisible();
    // The dashboard grid renders its KPI widgets.
    await expect(page.getByText("Active seats")).toBeVisible();
    // The sidebar defaults to two columns at desktop width.
    const sidebar = page.locator(".demo-panel .l-sidebar");
    await expect(sidebar).toHaveCSS("grid-template-columns", /.+ .+/);
  });

  test("app shell renders topbar/sidebar/main and collapses the sidebar", async ({
    page,
  }) => {
    await page.goto("./preview/app-shell");
    await expect(
      page.getByRole("heading", { name: "App shell", exact: true }),
    ).toBeVisible();
    // All three regions exist.
    await expect(page.locator(".l-app-shell__topbar")).toBeVisible();
    await expect(page.locator(".l-app-shell__sidebar")).toBeVisible();
    await expect(page.locator(".l-app-shell__main")).toBeVisible();
    // The collapse toggle shrinks the sidebar via data-sidebar.
    const rail = page.locator(".l-app-shell__sidebar");
    await expect(rail).toHaveAttribute("data-sidebar", "expanded");
    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    await expect(rail).toHaveAttribute("data-sidebar", "collapsed");
  });

  test("button page renders every variant", async ({ page }) => {
    await page.goto("./preview/button");
    await expect(
      page.getByRole("heading", { name: "Button", exact: true }),
    ).toBeVisible();
    // All three variants are present as real buttons.
    for (const v of ["primary", "secondary", "ghost"]) {
      await expect(
        page.getByRole("button", { name: v, exact: true }),
      ).toBeVisible();
    }
    // The disabled primary is actually disabled.
    await expect(
      page.locator(".c-button[data-variant='primary'][disabled]"),
    ).toBeDisabled();
  });

  test("field page renders labels and the hint", async ({ page }) => {
    await page.goto("./preview/field");
    await expect(
      page.getByRole("heading", { name: "Field", exact: true }),
    ).toBeVisible();
    // The label text is rendered.
    await expect(page.getByText("Workspace name")).toBeVisible();
    // The hint is rendered.
    await expect(
      page.getByText("Use a name your team recognizes."),
    ).toBeVisible();
    // The control is a real required input.
    const input = page.locator(".c-field__control").first();
    await expect(input).toHaveAttribute("required", "");
  });

  test("card page renders cards with headers and bodies", async ({ page }) => {
    await page.goto("./preview/card");
    await expect(
      page.getByRole("heading", { name: "Card", exact: true }),
    ).toBeVisible();
    // The standard card has its title and body.
    await expect(page.getByText("Quarterly usage")).toBeVisible();
    // Interactive cards are real links.
    const link = page.locator("a.c-card").first();
    await expect(link).toHaveAttribute("href", "#");
  });

  test("badge page renders every tone", async ({ page }) => {
    await page.goto("./preview/badge");
    await expect(
      page.getByRole("heading", { name: "Badge", exact: true }),
    ).toBeVisible();
    for (const tone of ["accent", "success", "warning", "danger"]) {
      await expect(
        page.locator(`.c-badge[data-tone='${tone}']`).first(),
      ).toBeVisible();
    }
  });

  test("popover menu opens and closes", async ({ page }) => {
    await page.goto("./preview/popover-menu");
    await expect(
      page.getByRole("heading", { name: "Popover menu", exact: true }),
    ).toBeVisible();
    // The popover exists but is closed initially.
    const popover = page.locator("#account-menu");
    await expect(popover).toBeHidden();
    // Click the trigger to open.
    await page.locator("[popovertarget='account-menu']").click();
    await expect(popover).toBeVisible();
    // Items are real links/buttons.
    await expect(page.locator("#account-menu a").first()).toBeVisible();
    // Esc closes.
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
  });
});

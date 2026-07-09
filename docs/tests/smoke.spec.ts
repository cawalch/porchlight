import { test, expect, type Page } from "@playwright/test";

async function expectDocumentScrollsOver(page: Page, selector: string) {
  const target = await page.evaluate((targetSelector) => {
    const element = document.querySelector<HTMLElement>(targetSelector);
    if (!element) return null;

    const scrollRoot = document.scrollingElement;
    if (!scrollRoot) return null;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);
    const pointFor = (
      rect: DOMRect,
      inlineOffset: number,
      blockOffset: number,
    ) => ({
      x: clamp(
        rect.left + Math.min(inlineOffset, rect.width / 2),
        1,
        innerWidth - 2,
      ),
      y: clamp(
        rect.top + Math.min(blockOffset, Math.max(rect.height / 2, 1)),
        80,
        innerHeight - 2,
      ),
    });

    const directPanes = [
      ...element.querySelectorAll<HTMLElement>(
        ":scope > .pl-c-split-pane__pane",
      ),
    ];
    const candidateRects = [element, ...directPanes]
      .map((candidate) => candidate.getBoundingClientRect())
      .filter(
        (rect) =>
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.top < innerHeight,
      );

    return {
      hasPageScroll: scrollRoot.scrollHeight > scrollRoot.clientHeight + 100,
      candidates: candidateRects.flatMap((rect) => [
        pointFor(rect, 48, 96),
        pointFor(rect, rect.width / 2, 240),
      ]),
    };
  }, selector);

  expect(
    target,
    `${selector} should exist for wheel-scroll check`,
  ).not.toBeNull();
  if (!target!.hasPageScroll) return;

  expect(
    target!.candidates.length,
    `${selector} should expose visible points for wheel-scroll check`,
  ).toBeGreaterThan(0);

  for (const candidate of target!.candidates) {
    await page.evaluate(() => {
      document.scrollingElement?.scrollTo({ top: 0 });
    });
    await page.mouse.move(candidate.x, candidate.y);
    await page.mouse.wheel(0, 520);

    const scrolled = await page
      .waitForFunction(() => (document.scrollingElement?.scrollTop ?? 0) > 80, {
        timeout: 800,
      })
      .then(() => true)
      .catch(() => false);
    if (scrolled) return;
  }

  const scrollTop = await page.evaluate(
    () => document.scrollingElement?.scrollTop ?? 0,
  );
  expect(
    scrollTop,
    `${selector} should allow page wheel scrolling`,
  ).toBeGreaterThan(80);
}

/**
 * Scaffold smoke tests: confirm the site builds and the accessible chrome
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

  test("preview index page is reachable", async ({ page }) => {
    await page.goto("./preview");
    await expect(
      page.getByRole("heading", { name: "Preview index" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Components" }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Search preview pages..."),
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
    await expect(playground).toHaveAttribute("data-pl-density", "comfortable");
    // Switch to touch density; the attribute (and thus --pl-control-block-size) changes.
    await page.getByRole("button", { name: "touch" }).click();
    await expect(playground).toHaveAttribute("data-pl-density", "touch");
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
    const sidebar = page.locator(".demo-panel .pl-l-sidebar");
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
    await expect(page.locator(".pl-l-app-shell__topbar")).toBeVisible();
    await expect(page.locator(".pl-l-app-shell__sidebar")).toBeVisible();
    await expect(page.locator(".pl-l-app-shell__main")).toBeVisible();
    // The collapse toggle shrinks the sidebar via data-sidebar.
    const rail = page.locator(".pl-l-app-shell__sidebar");
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
      page.locator(".pl-c-button[data-variant='primary'][disabled]"),
    ).toBeDisabled();
  });

  test("component docs expose search, preview, styles, and page contents", async ({
    page,
  }) => {
    await page.goto("./components/button");
    const content = page.locator(".docs-content");
    const rail = page.locator(".docs-rail");

    await expect(
      content.getByRole("heading", { name: "Button", exact: true }),
    ).toBeVisible();
    await expect(
      rail.getByRole("link", { name: "Live preview" }),
    ).toHaveAttribute("href", /\/preview\/button$/);
    await expect(
      rail.getByRole("link", { name: "Style source" }),
    ).toHaveAttribute("href", /button\.css$/);
    await expect(
      rail.getByRole("link", { name: "When to use what" }),
    ).toBeVisible();

    const command = page.getByRole("button", { name: /Search docs/ });
    await expect(command).toBeVisible();
    await command.click();

    const dialog = page.getByRole("dialog", { name: "Search Porchlight" });
    await expect(dialog).toBeVisible();

    const search = dialog.getByLabel("Search docs");
    await search.fill("timeline");
    await expect(dialog.getByRole("link", { name: "Timeline" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Button" })).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("command search remains interactive after docs client navigation", async ({
    page,
  }) => {
    await page.goto("./components/button");
    await page.locator(".docs-atlas a[href$='/components/field']").click();
    await expect(
      page.getByRole("heading", { name: "Field", exact: true, level: 1 }),
    ).toBeVisible();

    await page
      .getByRole("button", {
        name: "Search docs, components, styles Cmd K",
        exact: true,
      })
      .click();

    const dialog = page.getByRole("dialog", { name: "Search Porchlight" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Search docs")).toBeFocused();
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
    const input = page.locator(".pl-c-field__control").first();
    await expect(input).toHaveAttribute("required", "");
    await expect(page.locator(".pl-c-field--inline").first()).toBeVisible();
    await expect(page.locator(".pl-c-input-group").first()).toBeVisible();
  });

  test("form page renders SaaS form patterns", async ({ page }) => {
    await page.goto("./preview/form");
    await expect(
      page.getByRole("heading", { name: "Form", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-form").first()).toBeVisible();
    await expect(page.locator(".pl-c-form__grid").first()).toBeVisible();
    await expect(page.locator(".pl-c-choice-group").first()).toBeVisible();
    await expect(page.locator(".pl-c-input-group").first()).toBeVisible();
  });

  test("card page renders cards with headers and bodies", async ({ page }) => {
    await page.goto("./preview/card");
    await expect(
      page.getByRole("heading", { name: "Card", exact: true }),
    ).toBeVisible();
    // The standard card has its title and body.
    await expect(page.getByText("Quarterly usage")).toBeVisible();
    // Interactive cards are real links.
    const link = page.locator("a.pl-c-card").first();
    await expect(link).toHaveAttribute("href", "#");
  });

  test("badge page renders every tone", async ({ page }) => {
    await page.goto("./preview/badge");
    await expect(
      page.getByRole("heading", { name: "Badge", exact: true }),
    ).toBeVisible();
    for (const tone of ["accent", "success", "warning", "danger"]) {
      await expect(
        page.locator(`.pl-c-badge[data-tone='${tone}']`).first(),
      ).toBeVisible();
    }
    await expect(page.locator(".pl-c-badge-group").first()).toBeVisible();
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
    await expect(popover).not.toHaveAttribute("role", "menu");
    // Items are real links/buttons.
    await expect(page.locator("#account-menu a").first()).toBeVisible();
    // Esc closes.
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
  });

  test("popover menu examples use unique anchors", async ({ page }) => {
    await page.goto("./preview/popover-menu");

    // Every menu instance sets a unique --pl-c-menu-anchor so popovers do not
    // tether to the last trigger sharing the default anchor name.
    const menus = page.locator(".pl-c-menu");
    const count = await menus.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const anchors = new Set<string>();
    for (let i = 0; i < count; i++) {
      const style = (await menus.nth(i).getAttribute("style")) || "";
      const match = style.match(/--pl-c-menu-anchor:\s*(--[^;]+)/);
      expect(match, `instance ${i} must set --pl-c-menu-anchor`).not.toBeNull();
      anchors.add(match![1].trim());
    }
    expect(anchors.size).toBe(count);
  });

  test("dialog opens via trigger and closes via Esc", async ({ page }) => {
    await page.goto("./preview/dialog");
    await expect(
      page.getByRole("heading", { name: "Dialog", exact: true }),
    ).toBeVisible();
    // The dialog exists but is closed initially.
    const dialog = page.locator("#confirm-dialog");
    await expect(dialog).toBeHidden();
    // Click the trigger to open.
    await page.locator("[data-open='confirm-dialog']").click();
    await expect(dialog).toBeVisible();
    // The title is visible inside the dialog.
    await expect(dialog.getByText("Delete account?")).toBeVisible();
    // Esc closes.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("data table renders rows with sticky headers", async ({ page }) => {
    await page.goto("./preview/data-table");
    await expect(
      page.getByRole("heading", { name: "Data table", exact: true }),
    ).toBeVisible();
    // Headers are real <th> with scope.
    await expect(
      page.getByRole("columnheader", { name: "Account" }).first(),
    ).toBeVisible();
    // Body rows render (first account).
    await expect(page.getByText("Acme Ops").first()).toBeVisible();
    // The first row is marked selected.
    await expect(page.locator("tbody tr").first()).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("data table has sortable headers, checkboxes, and expandable rows", async ({
    page,
  }) => {
    await page.goto("./preview/data-table");
    // Sortable headers exist with arrows.
    await expect(page.locator("th[data-sort='asc']").first()).toBeVisible();
    await expect(page.locator("th[data-sort='desc']").first()).toBeVisible();
    await expect(page.locator(".pl-c-table__sort-icon").first()).toBeAttached();
    // Checkbox column cells exist.
    await expect(
      page.locator(".pl-c-table__check input[type='checkbox']").first(),
    ).toBeVisible();
    // Expand buttons exist.
    await expect(page.locator(".pl-c-table__expand").first()).toBeVisible();
    // Detail rows exist, first one open by default.
    const details = page.locator(".pl-c-table__detail");
    expect(await details.count()).toBeGreaterThanOrEqual(3);
    await expect(details.first()).toHaveAttribute("data-open");
    // Sticky column exists.
    await expect(page.locator(".pl-c-table__sticky-col").first()).toBeVisible();
    // Compact density table exists.
    await expect(
      page.locator(".pl-c-table-wrap[data-pl-density='compact']"),
    ).toBeVisible();
    // Loading state exists.
    await expect(page.locator("tbody[data-loading]")).toBeVisible();
    await expect(
      page.locator("tbody[data-loading] .pl-c-skeleton").first(),
    ).toBeVisible();
  });

  test("utilities page renders every utility", async ({ page }) => {
    await page.goto("./preview/utilities");
    await expect(
      page.getByRole("heading", { name: "Utilities", exact: true }),
    ).toBeVisible();
    // The screen-reader-only text exists in the DOM (even though it's not visible).
    await expect(page.getByText("Settings", { exact: true })).toBeAttached();
    // The truncate utility is applied.
    await expect(page.locator(".pl-u-truncate").first()).toHaveCSS(
      "text-overflow",
      "ellipsis",
    );
    await expect(page.locator(".pl-u-sr-only").first()).toHaveCSS(
      "position",
      "absolute",
    );
    const focusableHidden = page.locator(".pl-u-focusable-sr-only").first();
    await expect(focusableHidden).toHaveCSS("position", "absolute");
    await focusableHidden.focus();
    await expect(focusableHidden).toHaveCSS("position", "static");
    await expect(page.locator(".pl-u-min-0").first()).toHaveCSS(
      "min-inline-size",
      "0px",
    );
    await expect(page.locator(".pl-u-wrap-anywhere").first()).toHaveCSS(
      "overflow-wrap",
      "anywhere",
    );
    await expect(page.locator(".pl-u-marginless").first()).toHaveCSS(
      "margin-top",
      "0px",
    );
    const mutedColor = await page
      .locator(".pl-u-muted")
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    await expect(page.locator(".pl-u-muted-sm").first()).toHaveCSS(
      "color",
      mutedColor,
    );
    await expect(page.locator(".pl-u-icon-title").first()).toHaveCSS(
      "display",
      "inline-flex",
    );
  });

  test("dashboard composes stat tiles, table, and toolbar", async ({
    page,
  }) => {
    await page.goto("./preview/dashboard");
    await expect(
      page.getByRole("heading", { name: "Enterprise dashboard", exact: true }),
    ).toBeVisible();
    // KPI stat tiles render.
    await expect(page.getByText("Monthly revenue").first()).toBeVisible();
    await expect(page.locator(".pl-c-stat").first()).toBeVisible();
    // The data table inside the dashboard.
    await expect(
      page.getByRole("columnheader", { name: "Account" }).first(),
    ).toBeVisible();
    // The toolbar with search and primary action.
    await expect(page.locator(".pl-c-toolbar").first()).toBeVisible();
    // Tabs with counts.
    await expect(
      page.locator(".pl-c-tabs__tab[aria-selected='true']").first(),
    ).toBeVisible();
    // Pagination at the bottom.
    await expect(page.locator(".pl-c-pagination").first()).toBeVisible();
    // Skeleton loading state.
    await expect(page.locator(".pl-c-skeleton").first()).toBeVisible();
  });

  test("tabs page renders tablist and panels", async ({ page }) => {
    await page.goto("./preview/tabs");
    await expect(
      page.getByRole("heading", { name: "Tabs", exact: true }),
    ).toBeVisible();
    // The selected tab is visible.
    const selected = page
      .locator(".pl-c-tabs__tab[aria-selected='true']")
      .first();
    await expect(selected).toBeVisible();
    await expect(selected).toContainText("Overview");
    // A disabled tab exists.
    await expect(page.locator(".pl-c-tabs__tab[disabled]")).toBeDisabled();
    // The active panel is visible (not hidden).
    await expect(page.locator("#panel-overview")).toBeVisible();
    // Inactive panels are hidden.
    await expect(page.locator("#panel-accounts")).toHaveAttribute("hidden");
  });

  test("toolbar renders groups and a divider", async ({ page }) => {
    await page.goto("./preview/toolbar");
    await expect(
      page.getByRole("heading", { name: "Toolbar", exact: true }),
    ).toBeVisible();
    // At least two groups (leading + trailing).
    const groups = page.locator(".pl-c-toolbar__group");
    expect(await groups.count()).toBeGreaterThanOrEqual(2);
    // A divider exists.
    await expect(page.locator(".pl-c-toolbar__divider").first()).toBeVisible();
    const panelToolbar = page
      .locator('.pl-c-toolbar[data-surface="panel"]')
      .first();
    await expect(panelToolbar).toBeVisible();
    const panelSurface = await panelToolbar.evaluate((toolbar) => {
      const styles = getComputedStyle(toolbar);
      return {
        borderTopWidth: styles.borderTopWidth,
        borderRadius: Number.parseFloat(styles.borderTopLeftRadius),
        background: styles.backgroundColor,
      };
    });
    expect(panelSurface.borderTopWidth).toBe("1px");
    expect(panelSurface.borderRadius).toBeGreaterThan(0);
    expect(panelSurface.background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("pagination renders active page and nav buttons", async ({ page }) => {
    await page.goto("./preview/pagination");
    await expect(
      page.getByRole("heading", { name: "Pagination", exact: true }),
    ).toBeVisible();
    // The active page carries aria-current.
    await expect(
      page.locator(".pl-c-pagination__page[aria-current='page']").first(),
    ).toBeVisible();
    // Prev is disabled on page 1.
    await expect(page.locator(".pl-c-pagination__nav").first()).toBeDisabled();
    // An ellipsis exists.
    await expect(
      page.locator(".pl-c-pagination__ellipsis").first(),
    ).toBeVisible();
  });

  test("stat renders value, label, and trend", async ({ page }) => {
    await page.goto("./preview/stat");
    await expect(
      page.getByRole("heading", { name: "Stat", exact: true }),
    ).toBeVisible();
    // KPI tiles.
    await expect(page.getByText("Monthly revenue")).toBeVisible();
    await expect(page.getByText("$48,200").first()).toBeVisible();
    // Trend with direction.
    const up = page.locator(".pl-c-stat__trend[data-direction='up']").first();
    await expect(up).toBeVisible();
    // A sparkline SVG exists.
    await expect(page.locator(".pl-c-stat__spark svg").first()).toBeVisible();
  });

  test("skeleton renders text, circle, and rect shapes", async ({ page }) => {
    await page.goto("./preview/skeleton");
    await expect(
      page.getByRole("heading", { name: "Skeleton", exact: true }),
    ).toBeVisible();
    // Text shape (default).
    await expect(
      page.locator(".pl-c-skeleton[data-shape='text']").first(),
    ).toBeVisible();
    // Circle shape.
    await expect(
      page.locator(".pl-c-skeleton[data-shape='circle']").first(),
    ).toBeVisible();
    // Rect shape.
    await expect(
      page.locator(".pl-c-skeleton[data-shape='rect']").first(),
    ).toBeVisible();
  });

  test("empty state renders title, description, and actions", async ({
    page,
  }) => {
    await page.goto("./preview/empty-state");
    await expect(
      page.getByRole("heading", { name: "Empty state", exact: true }),
    ).toBeVisible();
    // The first empty state has a title.
    await expect(page.getByText("No accounts yet")).toBeVisible();
    // The actions row has a primary button.
    await expect(
      page
        .locator(".pl-c-empty__actions .pl-c-button[data-variant='primary']")
        .first(),
    ).toBeVisible();
    // The danger tone variant exists.
    await expect(page.locator(".pl-c-empty[data-tone='danger']")).toBeVisible();
  });

  test("alert renders every tone with title and body", async ({ page }) => {
    await page.goto("./preview/alert");
    await expect(
      page.getByRole("heading", { name: "Alert", exact: true }),
    ).toBeVisible();
    for (const tone of ["success", "warning", "danger"]) {
      await expect(
        page.locator(`.pl-c-alert[data-tone='${tone}']`).first(),
      ).toBeVisible();
    }
    await expect(
      page.locator(".pl-c-alert:not([data-tone])").first(),
    ).toBeVisible();
    await expect(page.locator(".pl-c-alert__icon svg").first()).toBeVisible();
  });

  test("progress renders determinate and indeterminate", async ({ page }) => {
    await page.goto("./preview/progress");
    await expect(
      page.getByRole("heading", { name: "Progress", exact: true }),
    ).toBeVisible();
    const bars = page.locator(".pl-c-progress__bar");
    expect(await bars.count()).toBeGreaterThanOrEqual(2);
    await expect(
      page.locator(".pl-c-progress[data-indeterminate]"),
    ).toBeVisible();
    await expect(
      page.locator(".pl-c-progress[data-tone='danger']"),
    ).toBeVisible();
  });

  test("avatar renders initials, image, and group", async ({ page }) => {
    await page.goto("./preview/avatar");
    await expect(
      page.getByRole("heading", { name: "Avatar", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".pl-c-avatar[data-size='sm']").first(),
    ).toBeVisible();
    await expect(
      page.locator(".pl-c-avatar[data-size='lg']").first(),
    ).toBeVisible();
    await expect(page.locator(".pl-c-avatar__img").first()).toBeVisible();
    await expect(page.locator(".pl-c-avatar-group").first()).toBeVisible();
    await expect(page.locator(".pl-c-avatar-group__more")).toBeVisible();
  });

  test("getting-started guide has install and layer instructions", async ({
    page,
  }) => {
    await page.goto("./guides/getting-started");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Getting Started", exact: true }),
    ).toBeVisible();
    // Should mention npm/pnpm install.
    await expect(content.getByText("npm install")).toBeVisible();
    // Should mention the layer pattern.
    await expect(
      content.getByText(/@layer porchlight.*app/).first(),
    ).toBeVisible();
  });

  test("theming guide covers tokens and density", async ({ page }) => {
    await page.goto("./guides/theming");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Theming", exact: true }),
    ).toBeVisible();
    await expect(content.getByText("data-pl-density").first()).toBeVisible();
    await expect(content.getByText("light-dark()").first()).toBeVisible();
  });

  test("browser-support guide has the support matrix", async ({ page }) => {
    await page.goto("./guides/browser-support");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Browser Support", exact: true }),
    ).toBeVisible();
    await expect(
      content.getByRole("heading", { name: "How degradation works" }),
    ).toBeVisible();
  });

  test("composition recipes guide covers model-friendly app composition", async ({
    page,
  }) => {
    await page.goto("./guides/composition-recipes");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", {
        name: "Composition Recipes",
        exact: true,
      }),
    ).toBeVisible();
    for (const heading of [
      "App Shell Recipe",
      "Dashboard Recipe",
      "Data Region Recipe",
      "Settings Page Recipe",
      "Dense Admin View Recipe",
    ]) {
      await expect(
        content.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }
    await expect(
      content.getByText("Do not make div-based tables"),
    ).toBeVisible();
    await expect(
      content.getByText("Do not put page headers inside"),
    ).toBeVisible();
    await expect(
      content.getByText("Do not nest cards inside cards"),
    ).toBeVisible();
  });

  test("llms text assets expose composition guidance", async ({ page }) => {
    const shortResponse = await page.goto("./llms.txt");
    expect(shortResponse?.ok(), "./llms.txt should be reachable").toBe(true);
    const shortText = await page.locator("body").textContent();
    expect(shortText).toContain("Porchlight");
    expect(shortText).toContain("## Agent routing");
    expect(shortText).toContain(
      "Do not make htmx, Alpine, Vue, or React wrappers",
    );
    expect(shortText).toContain("/preview/field");

    const fullResponse = await page.goto("./llms-full.txt");
    expect(fullResponse?.ok(), "./llms-full.txt should be reachable").toBe(
      true,
    );
    const fullText = await page.locator("body").textContent();
    expect(fullText).toContain("generated from the same source as /llms.txt");
    expect(fullText).toContain("## Validation form skeleton");
    expect(fullText).toContain("Generated from docs/src/content/components");
    expect(fullText).toContain("- reveal: /components/reveal");
    expect(fullText).toContain("- /preview/app-siem");
    expect(fullText).toContain("aria-invalid");
  });

  test("color token reference shows semantic pairs", async ({ page }) => {
    await page.goto("./tokens/color");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Color Tokens", exact: true }),
    ).toBeVisible();
    await expect(
      content.getByText("--pl-color-accent", { exact: true }),
    ).toBeVisible();
    await expect(
      content.getByText("--pl-color-bg", { exact: true }),
    ).toBeVisible();
  });

  test("typography token reference shows type scale", async ({ page }) => {
    await page.goto("./tokens/typography");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Typography Tokens", exact: true }),
    ).toBeVisible();
    await expect(content.getByText("--pl-text-md")).toBeVisible();
  });

  test("spacing token reference shows all scales", async ({ page }) => {
    await page.goto("./tokens/spacing");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", {
        name: "Spacing, Radius & Motion Tokens",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      content.getByText("--pl-space-4", { exact: true }).first(),
    ).toBeVisible();
    await expect(content.getByText("--pl-z-toast").first()).toBeVisible();
  });

  test("homepage shows feature highlights and stats", async ({ page }) => {
    await page.goto("./");
    await expect(
      page.getByRole("heading", { name: "Porchlight", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Choose the artifact you need")).toBeVisible();
    await expect(page.getByText("Preview before you ship")).toBeVisible();
    await expect(page.getByText("pnpm --filter ./docs test")).toBeVisible();
  });

  test("tooltip renders trigger and tooltip body", async ({ page }) => {
    await page.goto("./preview/tooltip");
    await expect(
      page.getByRole("heading", { name: "Tooltip", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-tooltip__trigger").first()).toBeVisible();
    await expect(page.locator(".pl-c-tooltip__body").first()).toHaveAttribute(
      "role",
      "tooltip",
    );
  });

  test("accordion renders details and summary", async ({ page }) => {
    await page.goto("./preview/accordion");
    await expect(
      page.getByRole("heading", { name: "Accordion", exact: true }),
    ).toBeVisible();
    const items = page.locator(".pl-c-accordion__item");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".pl-c-accordion__icon").first()).toBeVisible();
    // The open-by-default item exists.
    await expect(page.locator(".pl-c-accordion__item[open]")).toBeVisible();
  });

  test("switch renders tracks and thumbs", async ({ page }) => {
    await page.goto("./preview/switch");
    await expect(
      page.getByRole("heading", { name: "Switch", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-switch__track").first()).toBeVisible();
    await expect(page.locator(".pl-c-switch__thumb").first()).toBeVisible();
    await expect(
      page.locator(".pl-c-switch[data-size='sm']").first(),
    ).toBeVisible();
    await expect(
      page.locator(".pl-c-switch[data-size='lg']").first(),
    ).toBeVisible();
  });

  test("chip renders all tones and remove buttons", async ({ page }) => {
    await page.goto("./preview/chip");
    await expect(
      page.getByRole("heading", { name: "Chip", exact: true }),
    ).toBeVisible();
    for (const tone of ["success", "warning", "danger"]) {
      await expect(
        page.locator(`.pl-c-chip[data-tone='${tone}']`).first(),
      ).toBeVisible();
    }
    await expect(page.locator(".pl-c-chip__remove").first()).toBeVisible();
    await expect(page.locator(".pl-c-chip-group").first()).toBeVisible();
  });

  test("drawer renders with popover and side variants", async ({ page }) => {
    await page.goto("./preview/drawer");
    await expect(
      page.getByRole("heading", { name: "Drawer", exact: true }),
    ).toBeVisible();
    // The drawer elements exist with popover attribute.
    await expect(page.locator(".pl-c-drawer[popover]").first()).toBeAttached();
    // Both side variants exist.
    await expect(
      page.locator(".pl-c-drawer[data-side='start']"),
    ).toBeAttached();
    await expect(page.locator(".pl-c-drawer[data-side='end']")).toBeAttached();
    // Drawer has header, body, footer.
    await expect(page.locator(".pl-c-drawer__header").first()).toBeAttached();
    await expect(page.locator(".pl-c-drawer__body").first()).toBeAttached();
  });

  test("toast renders tones and close buttons", async ({ page }) => {
    await page.goto("./preview/toast");
    await expect(
      page.getByRole("heading", { name: "Toast", exact: true }),
    ).toBeVisible();
    // Toast stack exists.
    await expect(page.locator(".pl-c-toast-stack").first()).toBeVisible();
    // All tones present.
    for (const tone of ["success", "warning", "danger"]) {
      await expect(
        page.locator(`.pl-c-toast[data-tone='${tone}']`),
      ).toBeVisible();
    }
    // Default (no tone) toast exists.
    await expect(
      page.locator(".pl-c-toast:not([data-tone])").first(),
    ).toBeVisible();
    // Close buttons exist.
    await expect(page.locator(".pl-c-toast__close").first()).toBeVisible();
    for (const placement of [
      "bottom-end",
      "bottom-start",
      "top-end",
      "top-start",
    ]) {
      await expect(
        page
          .locator(`.pl-c-toast-stack[data-placement='${placement}']`)
          .first(),
      ).toBeVisible();
    }
    const placements = await page.evaluate(() => {
      const values = ["bottom-end", "bottom-start", "top-end", "top-start"];
      const out: Record<string, Record<string, string>> = {};
      for (const value of values) {
        const stack = document.createElement("div");
        stack.className = "pl-c-toast-stack";
        stack.dataset.placement = value;
        document.body.append(stack);
        const style = getComputedStyle(stack);
        out[value] = {
          blockStart: style.insetBlockStart,
          blockEnd: style.insetBlockEnd,
          inlineStart: style.insetInlineStart,
          inlineEnd: style.insetInlineEnd,
        };
        stack.remove();
      }
      return out;
    });
    expect(placements["bottom-end"].blockEnd).not.toBe("auto");
    expect(placements["bottom-end"].inlineEnd).not.toBe("auto");
    expect(placements["bottom-start"].inlineStart).not.toBe("auto");
    expect(placements["top-end"].blockStart).not.toBe("auto");
    expect(placements["top-start"].blockStart).not.toBe("auto");
    expect(placements["top-start"].inlineStart).not.toBe("auto");
  });

  test("scroll-progress bar and reveal sections exist", async ({ page }) => {
    await page.goto("./preview/scroll-progress");
    await expect(
      page.getByRole("heading", { name: "Scroll Progress", exact: true }),
    ).toBeVisible();
    // The progress bar element is attached.
    await expect(page.locator(".pl-c-scroll-progress")).toBeAttached();
    // Reveal sections exist.
    const reveals = page.locator(".pl-c-reveal");
    expect(await reveals.count()).toBeGreaterThanOrEqual(4);
    // Delay variants exist.
    await expect(page.locator(".pl-c-reveal[data-delay='1']")).toBeAttached();
    await expect(page.locator(".pl-c-reveal[data-delay='3']")).toBeAttached();
  });

  test("breadcrumb renders trail with current page", async ({ page }) => {
    await page.goto("./preview/breadcrumb");
    await expect(
      page.getByRole("heading", { name: "Breadcrumb", exact: true }),
    ).toBeVisible();
    // Links exist.
    await expect(page.locator(".pl-c-breadcrumb__link").first()).toBeVisible();
    // Current page exists.
    await expect(
      page.locator(".pl-c-breadcrumb__current").first(),
    ).toBeVisible();
    // Multiple items (trail).
    const items = page.locator(".pl-c-breadcrumb__item");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
  });

  test("stepper renders steps with all states", async ({ page }) => {
    await page.goto("./preview/stepper");
    await expect(
      page.getByRole("heading", { name: "Stepper", exact: true }),
    ).toBeVisible();
    // All three states exist.
    await expect(
      page.locator(".pl-c-stepper__step[data-state='completed']").first(),
    ).toBeVisible();
    await expect(
      page.locator(".pl-c-stepper__step[data-state='current']").first(),
    ).toBeVisible();
    await expect(
      page.locator(".pl-c-stepper__step[data-state='upcoming']").first(),
    ).toBeVisible();
    // Markers exist.
    await expect(page.locator(".pl-c-stepper__marker").first()).toBeVisible();
  });

  test("stepper collapses vertically in narrow containers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./preview/stepper");

    const state = await page.evaluate(() => {
      const scrollRoot = document.scrollingElement;
      const steppers = [
        ...document.querySelectorAll<HTMLElement>(".pl-c-stepper"),
      ];

      return {
        overflowX: scrollRoot
          ? scrollRoot.scrollWidth - scrollRoot.clientWidth
          : 0,
        steppers: steppers.map((stepper) => {
          const rect = stepper.getBoundingClientRect();
          const steps = [
            ...stepper.querySelectorAll<HTMLElement>(".pl-c-stepper__step"),
          ].map((step) => {
            const stepRect = step.getBoundingClientRect();
            const style = getComputedStyle(step);
            const connectorStyle = getComputedStyle(step, "::before");
            return {
              inlineSize: stepRect.width,
              flexDirection: style.flexDirection,
              textAlign: style.textAlign,
              connectorBlockSize:
                connectorStyle.content === "none"
                  ? 0
                  : Number.parseFloat(connectorStyle.blockSize),
            };
          });

          return { inlineSize: rect.width, steps };
        }),
      };
    });

    expect(state.overflowX).toBeLessThanOrEqual(1);
    expect(
      state.steppers.every((stepper) =>
        stepper.steps.every(
          (step) =>
            step.flexDirection === "row" &&
            step.textAlign === "start" &&
            Math.abs(step.inlineSize - stepper.inlineSize) <= 1,
        ),
      ),
    ).toBe(true);
    expect(
      state.steppers.every((stepper) =>
        stepper.steps
          .slice(0, -1)
          .every((step) => step.connectorBlockSize >= 12),
      ),
    ).toBe(true);
  });

  test("timeline renders items with dots and content", async ({ page }) => {
    await page.goto("./preview/timeline");
    await expect(
      page.getByRole("heading", { name: "Timeline", exact: true }),
    ).toBeVisible();
    const items = page.locator(".pl-c-timeline__item");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".pl-c-timeline__dot").first()).toBeVisible();
    await expect(page.locator(".pl-c-timeline__title").first()).toBeVisible();
    // Tone variant exists.
    await expect(
      page.locator(".pl-c-timeline__item[data-tone='success']"),
    ).toBeVisible();
  });

  test("textarea-auto renders with field-sizing", async ({ page }) => {
    await page.goto("./preview/textarea-auto");
    await expect(
      page.getByRole("heading", { name: "Auto-Growing Textarea", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-textarea-auto").first()).toBeVisible();
    // Disabled variant exists.
    await expect(page.locator(".pl-c-textarea-auto[disabled]")).toBeVisible();
  });

  test("segmented control renders radio groups with checked state", async ({
    page,
  }) => {
    await page.goto("./preview/segmented");
    await expect(
      page.getByRole("heading", { name: "Segmented control", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-segmented").first()).toBeVisible();
    // Multiple radiogroups.
    const groups = page.locator("[role='radiogroup']");
    expect(await groups.count()).toBeGreaterThanOrEqual(3);
    // Checked items exist.
    await expect(
      page.locator(".pl-c-segmented__item input:checked").first(),
    ).toBeAttached();
    // Disabled item exists.
    await expect(
      page.locator(".pl-c-segmented__item input:disabled"),
    ).toBeAttached();
  });

  test("tag input renders chips and inline field", async ({ page }) => {
    await page.goto("./preview/tag-input");
    await expect(
      page.getByRole("heading", { name: "Tag input", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-tag-input").first()).toBeVisible();
    await expect(page.locator(".pl-c-tag-input__field").first()).toBeVisible();
    await expect(
      page.locator(".pl-c-tag-input .pl-c-chip").first(),
    ).toBeVisible();
    await expect(page.locator(".pl-c-chip__remove").first()).toBeVisible();

    const labelsWithButtons = await page
      .locator("label.pl-c-field:has(button)")
      .count();
    expect(
      labelsWithButtons,
      "tag inputs must not wrap remove buttons in labels",
    ).toBe(0);
  });

  test("description list renders terms and details", async ({ page }) => {
    await page.goto("./preview/description-list");
    await expect(
      page.getByRole("heading", { name: "Description list", exact: true }),
    ).toBeVisible();
    // The dl element exists.
    await expect(page.locator(".pl-c-description").first()).toBeVisible();
    // Terms and details are present.
    await expect(page.locator(".pl-c-description__term").first()).toBeVisible();
    await expect(
      page.locator(".pl-c-description__detail").first(),
    ).toBeVisible();
    // Multiple rows exist.
    expect(
      await page.locator(".pl-c-description__row").count(),
    ).toBeGreaterThanOrEqual(3);
    // Dividers variant exists.
    await expect(
      page.locator(".pl-c-description[data-dividers]").first(),
    ).toBeAttached();
    // Stacked layout variant exists.
    await expect(
      page.locator(".pl-c-description[data-layout='stacked']").first(),
    ).toBeAttached();
  });

  test("page header renders title, subtitle, and actions", async ({ page }) => {
    await page.goto("./preview/page-header");
    await expect(
      page.getByRole("heading", { name: "Page header", exact: true }),
    ).toBeVisible();
    // The component exists.
    await expect(page.locator(".pl-c-page-header").first()).toBeVisible();
    // Title is present.
    await expect(
      page.locator(".pl-c-page-header__title").first(),
    ).toBeVisible();
    // Actions contain real buttons.
    await expect(
      page.locator(".pl-c-page-header__actions .pl-c-button").first(),
    ).toBeVisible();
    // Subtitle variant exists.
    await expect(
      page.locator(".pl-c-page-header__subtitle").first(),
    ).toBeVisible();
    // Page header composes with a data table.
    await expect(
      page.locator(".pl-c-page-header ~ .pl-c-table-wrap .pl-c-table"),
    ).toBeVisible();
  });

  test("dropdown renders trigger and menu options", async ({ page }) => {
    await page.goto("./preview/dropdown");
    await expect(
      page.getByRole("heading", { name: "Dropdown", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-dropdown__trigger").first()).toBeVisible();
    await expect(page.locator(".pl-c-dropdown__chevron").first()).toBeVisible();
    await expect(page.locator("#dd-trigger-1")).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
    await expect(page.locator("#dd-trigger-1")).toHaveAttribute(
      "aria-controls",
      "dd-1",
    );
    await expect(page.locator("#dd-trigger-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    // Menus exist with popover attr.
    const menu = page.locator("#dd-1");
    await expect(menu).toBeAttached();
    await expect(menu).toHaveAttribute("role", "menu");
    // Options exist.
    await expect(page.locator(".pl-c-dropdown__option").first()).toBeAttached();
    await expect(
      menu.locator("[role='menuitemradio']").first(),
    ).toHaveAttribute("aria-checked", "true");

    await page.locator("#dd-trigger-1").click();
    await expect(menu).toBeVisible();
    await expect(page.locator("#dd-trigger-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(
      page.getByRole("menuitemradio", { name: "Project Alpha" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitemradio", { name: "Project Beta" }),
    ).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      page.getByRole("menuitem", { name: "Delete project" }),
    ).toBeFocused();
    await page.keyboard.press("Home");
    await expect(
      page.getByRole("menuitemradio", { name: "Project Alpha" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.locator("#dd-trigger-1")).toBeFocused();

    await page.locator("#dd-trigger-1").press("ArrowUp");
    await expect(menu).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Delete project" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");

    await page.locator("#dd-trigger-1").press("ArrowDown");
    await expect(menu).toBeVisible();
    await page.getByRole("menuitemradio", { name: "Project Beta" }).click();
    await expect(page.locator("#dd-trigger-1")).toContainText("Project Beta");
    await expect(
      page.getByRole("menuitemradio", { name: "Project Beta" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(menu).toBeHidden();
    await expect(page.locator("#dd-trigger-1")).toBeFocused();
  });

  test("split button renders segments, menu, and unique anchors", async ({
    page,
  }) => {
    await page.goto("./preview/split-button");
    await expect(
      page.getByRole("heading", { name: "Split button", exact: true }),
    ).toBeVisible();

    // Primary + toggle segments are present.
    await expect(page.locator(".pl-c-split__primary").first()).toBeVisible();
    await expect(page.locator(".pl-c-split__toggle").first()).toBeVisible();
    await expect(page.locator(".pl-c-split__chevron").first()).toBeVisible();

    // Both segments of each instance share the same data-variant.
    const firstSplit = page.locator(".pl-c-split").first();
    const primaryVariant = await firstSplit
      .locator(".pl-c-split__primary")
      .getAttribute("data-variant");
    const toggleVariant = await firstSplit
      .locator(".pl-c-split__toggle")
      .getAttribute("data-variant");
    expect(primaryVariant).toBe(toggleVariant);

    // Menus exist with popover attr.
    await expect(
      page.locator(".pl-c-split__menu[popover]").first(),
    ).toBeAttached();
    // Options exist, including a danger item.
    await expect(page.locator(".pl-c-split__option").first()).toBeAttached();
    await expect(
      page.locator(".pl-c-split__option[data-tone='danger']").first(),
    ).toBeAttached();

    // Every menu-bearing instance has a unique split anchor so popovers don't
    // all tether to the last toggle on the page. The value may come from local
    // preview CSS rather than an inline style.
    const splits = page.locator(".pl-c-split:has(.pl-c-split__menu)");
    const count = await splits.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const anchors = new Set<string>();
    for (let i = 0; i < count; i++) {
      const anchor = await splits
        .nth(i)
        .evaluate((split) =>
          getComputedStyle(split)
            .getPropertyValue("--pl-c-split-anchor")
            .trim(),
        );
      expect(anchor, `instance ${i} must set --pl-c-split-anchor`).toMatch(
        /^--.+/,
      );
      anchors.add(anchor);
    }
    // No two instances share an anchor name.
    expect(anchors.size).toBe(count);
  });

  test("split button menu opens via toggle and closes via Esc", async ({
    page,
  }) => {
    await page.goto("./preview/split-button");
    // The first menu is closed initially.
    const menu = page.locator("#sb-1");
    await expect(menu).toBeHidden();
    // Click the toggle to open.
    await page.locator("[popovertarget='sb-1']").click();
    await expect(menu).toBeVisible();
    // Options are real buttons inside the open popover.
    await expect(menu.locator(".pl-c-split__option").first()).toBeVisible();
    // Esc closes.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("file upload renders zone with hidden input", async ({ page }) => {
    await page.goto("./preview/file-upload");
    await expect(
      page.getByRole("heading", { name: "File upload", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-file-upload__zone").first()).toBeVisible();
    await expect(
      page.locator(".pl-c-file-upload__input").first(),
    ).toHaveAttribute("type", "file");
    // Disabled variant exists.
    await expect(
      page.locator(".pl-c-file-upload__input[disabled]"),
    ).toBeAttached();
  });

  test("command palette renders popover with search and items", async ({
    page,
  }) => {
    await page.goto("./preview/command-palette");
    await expect(
      page.getByRole("heading", { name: "Command palette", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".pl-c-command[popover]")).toBeAttached();
    await expect(page.locator(".pl-c-command[popover]")).toHaveAttribute(
      "role",
      "dialog",
    );
    await expect(
      page.getByRole("button", { name: "Open command palette" }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".pl-c-command__search")).toBeAttached();
    await expect(page.locator(".pl-c-command__search")).toHaveAttribute(
      "role",
      "combobox",
    );
    await expect(page.locator(".pl-c-command__item").first()).toBeAttached();
    await expect(page.locator(".pl-c-command__heading").first()).toBeAttached();
    // Footer exists (may be hidden since popover is closed).
    await expect(page.locator(".pl-c-command__footer")).toBeAttached();

    await page.getByRole("button", { name: "Open command palette" }).click();
    await expect(page.locator("#cmdk")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open command palette" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.getByLabel("Search commands").press("ArrowDown");
    await expect(page.locator("#cmdk-import")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByLabel("Search commands")).toHaveAttribute(
      "aria-activedescendant",
      "cmdk-import",
    );
  });

  test("nav renders items, active state, and collapsible sections", async ({
    page,
  }) => {
    await page.goto("./preview/nav");
    await expect(
      page.getByRole("heading", { name: "Nav", exact: true }),
    ).toBeVisible();
    // Nav items exist.
    await expect(page.locator(".pl-c-nav__item").first()).toBeVisible();
    await expect(page.locator(".pl-c-nav__label").first()).toBeVisible();
    // Active item exists.
    await expect(
      page.locator(".pl-c-nav__item[aria-current='page']").first(),
    ).toBeVisible();
    // Icons exist.
    await expect(page.locator(".pl-c-nav__icon").first()).toBeVisible();
    // Collapsible section exists and one is open.
    await expect(page.locator(".pl-c-nav__section").first()).toBeVisible();
    await expect(page.locator(".pl-c-nav__section[open]")).toBeVisible();
    // Chevron exists.
    await expect(page.locator(".pl-c-nav__chevron").first()).toBeVisible();
    // Icons-only variant exists.
    await expect(page.locator(".pl-c-nav[data-variant='icons']")).toBeVisible();
    // Child items exist.
    await expect(page.locator(".pl-c-nav__item--child").first()).toBeVisible();
    // Group labels, dividers, and nav-hosted menus exist.
    await expect(page.locator(".pl-c-nav__group-label").first()).toBeVisible();
    await expect(page.locator(".pl-c-nav__divider").first()).toBeAttached();
    await expect(page.locator(".pl-c-nav__menu").first()).toBeVisible();
    await expect(
      page.locator(".pl-c-nav__menu .pl-c-menu__trigger").first(),
    ).toBeVisible();
    // Generic footer metadata and compact nav actions exist.
    await expect(page.locator(".pl-c-nav__meta").first()).toBeVisible();
    await expect(page.locator(".pl-c-nav__action").first()).toBeVisible();
    await expect(page.locator("a.pl-c-nav__action").first()).toBeVisible();
    await expect(page.locator("button.pl-c-nav__action").first()).toBeVisible();
  });

  test("app-dashboard renders app shell with nav, stats, and table", async ({
    page,
  }) => {
    await page.goto("./preview/app-dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }).first(),
    ).toBeVisible();
    // App shell layout.
    await expect(page.locator(".pl-l-app-shell")).toBeVisible();
    await expect(page.locator(".pl-l-app-shell__topbar")).toBeVisible();
    await expect(page.locator(".pl-l-app-shell__sidebar")).toBeVisible();
    // Nav items exist.
    await expect(page.locator(".pl-c-nav__item").first()).toBeVisible();
    // KPI stat cards.
    const stats = page.locator(".pl-c-stat");
    expect(await stats.count()).toBeGreaterThanOrEqual(4);
    // Data table with toolbar.
    await expect(page.locator(".pl-c-table-wrap")).toBeVisible();
    await expect(page.locator(".pl-c-toolbar").first()).toBeVisible();
    // Segmented view toggle.
    await expect(page.locator(".pl-c-segmented").first()).toBeVisible();
    // Pagination.
    await expect(page.locator(".pl-c-pagination")).toBeVisible();
    // Timeline.
    await expect(page.locator(".pl-c-timeline").first()).toBeVisible();
  });

  test("app-inbox renders master-detail with sidebar collapse", async ({
    page,
  }) => {
    await page.goto("./preview/app-inbox");
    await expect(
      page.getByRole("heading", { name: "Responsive inbox", exact: true }),
    ).toBeVisible();
    // Folder nav exists.
    await expect(page.locator(".pl-c-nav").first()).toBeVisible();
    // Master-detail sidebar layout.
    await expect(page.locator(".pl-l-sidebar")).toBeVisible();
    // Message list items.
    const msgs = page.locator(".msg-item");
    expect(await msgs.count()).toBeGreaterThanOrEqual(5);
    // Message detail exists.
    await expect(page.locator(".msg-detail")).toBeVisible();
    // Search field exists.
    await expect(page.locator("input[type='search']")).toBeVisible();
  });

  test("app-marketing renders hero, masonry, and scroll animations", async ({
    page,
  }) => {
    await page.goto("./preview/app-marketing");
    await expect(
      page.getByRole("heading", {
        name: "Build beautiful, accessible UI",
        exact: false,
      }),
    ).toBeVisible();
    // Scroll progress bar.
    await expect(page.locator(".pl-c-scroll-progress")).toBeAttached();
    // Feature cards in multi-column layout.
    await expect(page.locator(".pl-l-columns").first()).toBeVisible();
    const cards = page.locator(".pl-l-columns .pl-c-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
    // Reveal elements exist.
    const reveals = page.locator(".pl-c-reveal");
    expect(await reveals.count()).toBeGreaterThanOrEqual(5);
    // Stat blocks.
    await expect(page.locator(".stat-block").first()).toBeVisible();
    // Container layout.
    await expect(page.locator(".pl-l-container").first()).toBeVisible();
    // Inset content inside full-bleed hero.
    await expect(page.locator(".pl-l-inset").first()).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // SIEM Console (data-dense security operations example)
  // -----------------------------------------------------------------------
  test("app-siem renders alert queue, KPIs, and event stream", async ({
    page,
  }) => {
    await page.goto("./preview/app-siem");
    await expect(
      page.getByRole("heading", { name: "Security Operations" }),
    ).toBeVisible();
    // KPI tiles.
    const stats = page.locator(".siem-kpi");
    expect(await stats.count()).toBeGreaterThanOrEqual(4);
    // Alert data table with rows.
    await expect(page.locator(".pl-c-table")).toBeVisible();
    const alertRows = page.locator(".pl-c-table tbody tr");
    expect(await alertRows.count()).toBeGreaterThanOrEqual(10);
    // Severity badges.
    expect(
      await page.locator(".pl-c-badge[data-tone='danger']").count(),
    ).toBeGreaterThanOrEqual(3);
    // Live event timeline.
    await expect(page.locator(".pl-c-timeline")).toBeVisible();
    const events = page.locator(".pl-c-timeline__item");
    expect(await events.count()).toBeGreaterThanOrEqual(6);
    // Sidebar nav.
    await expect(page.locator(".pl-c-nav")).toBeVisible();
    // Command palette exists.
    await expect(page.locator("#siem-cmdk")).toBeAttached();
    // Pagination.
    await expect(page.locator(".pl-c-pagination")).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Case/Ticket Review (data-dense case management example)
  // -----------------------------------------------------------------------
  test("app-cases renders ticket list, filters, and detail drawer", async ({
    page,
  }) => {
    await page.goto("./preview/app-cases");
    await expect(
      page.getByRole("heading", { name: "Cases", exact: true }),
    ).toBeVisible();
    // Filter chips.
    expect(
      await page.locator(".cases-filters .pl-c-chip").count(),
    ).toBeGreaterThanOrEqual(2);
    // Case data table.
    await expect(page.locator(".pl-c-table")).toBeVisible();
    const caseRows = page.locator(".pl-c-table tbody tr");
    expect(await caseRows.count()).toBeGreaterThanOrEqual(10);
    // Priority badges.
    expect(
      await page.locator(".pl-c-badge[data-tone='danger']").count(),
    ).toBeGreaterThanOrEqual(1);
    // Tag chips in table.
    expect(
      await page.locator(".pl-c-table .pl-c-chip").count(),
    ).toBeGreaterThanOrEqual(5);
    // Avatar group in filter bar.
    await expect(page.locator(".pl-c-avatar-group")).toBeVisible();
    // Team workload sidebar.
    await expect(page.locator(".cases-workload")).toBeVisible();
    // Detail drawer exists (popover).
    await expect(page.locator("#case-detail")).toBeAttached();
    // Pagination.
    await expect(page.locator(".pl-c-pagination")).toBeVisible();
  });

  test("app-dense renders compact console with KPIs and event table", async ({
    page,
  }) => {
    await page.goto("./preview/app-dense");
    // The dense density tier is active on the container.
    await expect(
      page.locator(".dense-app[data-pl-density='dense']"),
    ).toBeVisible();
    // Topbar with brand and search.
    await expect(page.locator(".dense-brand")).toBeVisible();
    await expect(page.locator(".dense-search input")).toBeVisible();
    // KPI strip with 8 metrics.
    expect(await page.locator(".dense-kpi").count()).toBeGreaterThanOrEqual(8);
    // Event data table with rows.
    await expect(page.locator(".dense-table .pl-c-table")).toBeVisible();
    const eventRows = page.locator(".dense-table tbody tr");
    expect(await eventRows.count()).toBeGreaterThanOrEqual(10);
    // Severity badges in table.
    expect(
      await page.locator(".dense-table .pl-c-badge").count(),
    ).toBeGreaterThanOrEqual(5);
    // Split button in toolbar.
    await expect(
      page.locator(".dense-toolbar .pl-c-split__toggle"),
    ).toBeVisible();
    // Sidebar nav sections.
    expect(
      await page.locator(".dense-nav-item").count(),
    ).toBeGreaterThanOrEqual(10);
    // Pagination.
    await expect(page.locator(".dense-pager .pl-c-pagination")).toBeVisible();
  });

  test("list detail preview keeps medium-width spacing and table overflow controlled", async ({
    page,
  }) => {
    for (const width of [1024, 1280, 1440, 1600]) {
      await page.setViewportSize({
        width,
        height: width === 1024 ? 576 : 720,
      });
      await page.goto("./preview/app-list-detail");

      const layout = await page.evaluate(() => {
        const shellTopbar = document.querySelector(
          ".list-detail-shell > .pl-l-app-shell__topbar",
        );
        const sidebar = document.querySelector(".pl-l-app-shell__sidebar");
        const workspace = document.querySelector(".list-detail-workspace");
        const split = document.querySelector(".list-detail-split");
        const startPane = document.querySelector(
          ".list-detail-split > .pl-c-split-pane__pane--start",
        );
        const endPane = document.querySelector(
          ".list-detail-split > .pl-c-split-pane__pane--end",
        );
        const tableWrap = document.querySelector(".list-detail-table");
        const listBody = document.querySelector(".list-detail-list-body");
        const dueHeader = document.querySelector(
          ".list-detail-table th:nth-child(6)",
        );

        if (
          !(
            shellTopbar &&
            sidebar &&
            workspace &&
            split &&
            startPane &&
            endPane &&
            tableWrap &&
            listBody &&
            dueHeader
          )
        ) {
          return null;
        }

        const sidebarRect = sidebar.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        const splitRect = split.getBoundingClientRect();
        const startRect = startPane.getBoundingClientRect();
        const endRect = endPane.getBoundingClientRect();
        const listBodyStyle = getComputedStyle(listBody);
        const startPaneStyle = getComputedStyle(startPane);
        const endPaneStyle = getComputedStyle(endPane);
        const tableWrapStyle = getComputedStyle(tableWrap);

        return {
          appTopbarStatic: getComputedStyle(shellTopbar).position === "static",
          workspaceAligned:
            Math.abs(workspaceRect.left - splitRect.left) < 2 &&
            workspaceRect.left - sidebarRect.right >= 16,
          tableOverflowControlled:
            tableWrap.scrollWidth >= tableWrap.clientWidth &&
            tableWrapStyle.overflowX === "auto" &&
            tableWrap.getBoundingClientRect().right <=
              startRect.right - parseFloat(listBodyStyle.paddingInlineEnd) + 1,
          listBodyInset:
            parseFloat(listBodyStyle.paddingInlineStart) >= 12 &&
            parseFloat(listBodyStyle.paddingInlineEnd) >= 12,
          panesUsePageScroll:
            startPaneStyle.overflowY === "visible" &&
            endPaneStyle.overflowY === "visible" &&
            startPaneStyle.overscrollBehavior === "auto" &&
            endPaneStyle.overscrollBehavior === "auto",
          detailStacksWhenNarrow:
            innerWidth > 1024 || endRect.top > startRect.bottom,
          detailInlineWhenWide:
            innerWidth < 1280 ||
            (Math.abs(startRect.top - endRect.top) < 4 &&
              endRect.left > startRect.left),
          dueColumnResponsive:
            innerWidth < 1600
              ? getComputedStyle(dueHeader).display === "none"
              : getComputedStyle(dueHeader).display !== "none",
        };
      });

      expect(layout).not.toBeNull();
      expect(layout!.appTopbarStatic).toBe(true);
      expect(layout!.workspaceAligned).toBe(true);
      expect(layout!.tableOverflowControlled).toBe(true);
      expect(layout!.listBodyInset).toBe(true);
      expect(layout!.panesUsePageScroll).toBe(true);
      expect(layout!.detailStacksWhenNarrow).toBe(true);
      expect(layout!.detailInlineWhenWide).toBe(true);
      expect(layout!.dueColumnResponsive).toBe(true);
    }
  });

  test("process builder preview keeps desktop inspector inline and page scroll intact", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 800 });
    await page.goto("./preview/app-process-builder");

    const desktopLayout = await page.evaluate(() => {
      const siteHeader = document.querySelector(".site-header");
      const appTopbar = document.querySelector(
        ".builder-shell > .pl-l-app-shell__topbar",
      );
      const map = document.querySelector(
        ".builder-editor-split > .pl-c-split-pane__pane--start",
      );
      const inspector = document.querySelector(
        ".builder-editor-split > .pl-c-split-pane__pane--end",
      );
      const editorSplit = document.querySelector(".builder-editor-split");

      if (!(siteHeader && appTopbar && map && inspector && editorSplit)) {
        return null;
      }

      const appTopbarRect = appTopbar.getBoundingClientRect();
      const siteHeaderRect = siteHeader.getBoundingClientRect();
      const mapRect = map.getBoundingClientRect();
      const inspectorRect = inspector.getBoundingClientRect();
      const mapStyle = getComputedStyle(map);
      const inspectorStyle = getComputedStyle(inspector);
      const frameStroke = getComputedStyle(editorSplit, "::after");

      return {
        appTopbarClearsSiteHeader:
          appTopbarRect.top >= siteHeaderRect.bottom - 1,
        inspectorInline:
          Math.abs(mapRect.top - inspectorRect.top) < 4 &&
          inspectorRect.left > mapRect.left,
        mapUsesPageScroll:
          mapStyle.overflowY === "visible" &&
          mapStyle.overscrollBehavior === "auto",
        inspectorUsesPageScroll:
          inspectorStyle.overflowY === "visible" &&
          inspectorStyle.overscrollBehavior === "auto",
        editorFrameStroke:
          frameStroke.borderTopStyle === "solid" &&
          frameStroke.borderTopWidth === "1px" &&
          frameStroke.borderRadius !== "0px",
      };
    });

    expect(desktopLayout).not.toBeNull();
    expect(desktopLayout!.appTopbarClearsSiteHeader).toBe(true);
    expect(desktopLayout!.inspectorInline).toBe(true);
    expect(desktopLayout!.mapUsesPageScroll).toBe(true);
    expect(desktopLayout!.inspectorUsesPageScroll).toBe(true);
    expect(desktopLayout!.editorFrameStroke).toBe(true);
  });

  test("process builder preview clips rounded mobile shells", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 640 });
    await page.goto("./preview/app-process-builder");

    const clippedShells = await page.evaluate(() => {
      const alert = document.querySelector(".pl-c-alert[data-tone='warning']");
      const builderSplit = document.querySelector(".builder-split");
      const editorSplit = document.querySelector(".builder-editor-split");

      if (!(alert && builderSplit && editorSplit)) {
        return null;
      }

      return [alert, builderSplit, editorSplit].map((element) => {
        const style = getComputedStyle(element);
        return {
          borderRadius: style.borderRadius,
          overflow: style.overflow,
        };
      });
    });

    expect(clippedShells).not.toBeNull();
    expect(
      clippedShells!.every(
        (shell) => shell.overflow === "hidden" && shell.borderRadius !== "0px",
      ),
    ).toBe(true);
  });

  test("app split-pane examples keep page scroll and contained table overflow", async ({
    page,
  }) => {
    const examples = [
      {
        route: "./preview/app-list-detail",
        splitSelectors: [".list-detail-split"],
      },
      {
        route: "./preview/app-queue-triage",
        splitSelectors: [".pl-l-app-shell__main > .pl-c-split-pane"],
      },
      {
        route: "./preview/app-process-builder",
        splitSelectors: [".builder-split", ".builder-editor-split"],
      },
      {
        route: "./preview/app-command-workspace",
        splitSelectors: [".pl-l-app-shell__main .pl-c-split-pane"],
      },
    ];

    await page.setViewportSize({ width: 1280, height: 720 });

    for (const example of examples) {
      await page.goto(example.route);

      const state = await page.evaluate((splitSelectors) => {
        const splits = splitSelectors.map((selector) => {
          const split = document.querySelector(selector);
          const panes = split
            ? [
                ...split.querySelectorAll<HTMLElement>(
                  ":scope > .pl-c-split-pane__pane",
                ),
              ]
            : [];

          return {
            selector,
            exists: Boolean(split),
            panes: panes.map((pane) => {
              const style = getComputedStyle(pane);
              return {
                overflowY: style.overflowY,
                overscrollBehavior: style.overscrollBehavior,
                scrollbarGutter: style.scrollbarGutter,
              };
            }),
          };
        });

        const tableWraps = [
          ...document.querySelectorAll<HTMLElement>(
            ".pl-l-app-shell__main .pl-c-table-wrap",
          ),
        ].map((wrap) => {
          const rect = wrap.getBoundingClientRect();
          const style = getComputedStyle(wrap);
          return {
            width: rect.width,
            right: rect.right,
            scrollDelta: wrap.scrollWidth - wrap.clientWidth,
            overflowX: style.overflowX,
          };
        });

        return {
          splits,
          tableWraps,
        };
      }, example.splitSelectors);

      for (const split of state.splits) {
        expect(
          split.exists,
          `${example.route} should render ${split.selector}`,
        ).toBe(true);
        expect(
          split.panes.length,
          `${example.route} should expose split panes for ${split.selector}`,
        ).toBeGreaterThanOrEqual(2);
        expect(
          split.panes.every(
            (pane) =>
              pane.overflowY === "visible" &&
              pane.overscrollBehavior === "auto" &&
              pane.scrollbarGutter === "auto",
          ),
          `${example.route} panes should use page scroll for ${split.selector}`,
        ).toBe(true);
      }

      for (const tableWrap of state.tableWraps) {
        expect(
          tableWrap.right,
          `${example.route} table scroller should stay inside the viewport`,
        ).toBeLessThanOrEqual(1281);
        expect(
          tableWrap.width,
          `${example.route} data table should keep usable desktop width`,
        ).toBeGreaterThanOrEqual(480);
        expect(
          tableWrap.scrollDelta <= 1 ||
            ["auto", "scroll"].includes(tableWrap.overflowX),
          `${example.route} overflowing tables should scroll inside .pl-c-table-wrap`,
        ).toBe(true);
      }

      await expectDocumentScrollsOver(page, example.splitSelectors[0]);
    }
  });

  test.describe("app composition kits", () => {
    const kits = [
      {
        route: "./preview/app-list-detail",
        heading: "Operator queue",
        selector: ".pl-c-split-pane",
      },
      {
        route: "./preview/app-queue-triage",
        heading: "Queue triage",
        selector: ".pl-c-workflow-board",
      },
      {
        route: "./preview/app-process-builder",
        heading: "Vendor onboarding",
        selector: ".pl-c-tabs",
      },
      {
        route: "./preview/app-settings-console",
        heading: "Settings",
        selector: "#settings-console-form",
      },
      {
        route: "./preview/app-reporting-dashboard",
        heading: "Revenue performance",
        selector: ".pl-c-chart",
      },
      {
        route: "./preview/app-command-workspace",
        heading: "Command center",
        selector: "#workspace-command",
      },
    ];

    for (const kit of kits) {
      test(`${kit.route.replace("./preview/", "")} renders`, async ({
        page,
      }) => {
        await page.goto(kit.route);
        await expect(
          page.getByRole("heading", {
            name: kit.heading,
            exact: true,
            level: 1,
          }),
        ).toBeVisible();
        await expect(page.locator(kit.selector).first()).toBeAttached();
      });
    }
  });
});

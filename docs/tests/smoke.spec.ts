import { test, expect } from "@playwright/test";

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
    await expect(page.locator(".c-table__sort-icon").first()).toBeAttached();
    // Checkbox column cells exist.
    await expect(page.locator(".c-table__check input[type='checkbox']").first()).toBeVisible();
    // Expand buttons exist.
    await expect(page.locator(".c-table__expand").first()).toBeVisible();
    // Detail rows exist, first one open by default.
    const details = page.locator(".c-table__detail");
    expect(await details.count()).toBeGreaterThanOrEqual(3);
    await expect(details.first()).toHaveAttribute("open");
    // Sticky column exists.
    await expect(page.locator(".c-table__sticky-col").first()).toBeVisible();
    // Compact density table exists.
    await expect(page.locator(".c-table-wrap[data-density='compact']")).toBeVisible();
    // Loading state exists.
    await expect(page.locator("tbody[data-loading]")).toBeVisible();
    await expect(page.locator("tbody[data-loading] .c-skeleton").first()).toBeVisible();
  });

  test("utilities page renders every utility", async ({ page }) => {
    await page.goto("./preview/utilities");
    await expect(
      page.getByRole("heading", { name: "Utilities", exact: true }),
    ).toBeVisible();
    // The visually-hidden text exists in the DOM (even though it's not visible).
    await expect(page.getByText("Settings", { exact: true })).toBeAttached();
    // The truncate utility is applied.
    await expect(page.locator(".u-truncate")).toHaveCSS(
      "text-overflow",
      "ellipsis",
    );
  });

  test("dashboard composes stat tiles, table, and toolbar", async ({ page }) => {
    await page.goto("./preview/dashboard");
    await expect(
      page.getByRole("heading", { name: "Enterprise dashboard", exact: true }),
    ).toBeVisible();
    // KPI stat tiles render.
    await expect(page.getByText("Monthly revenue").first()).toBeVisible();
    await expect(page.locator(".c-stat").first()).toBeVisible();
    // The data table inside the dashboard.
    await expect(
      page.getByRole("columnheader", { name: "Account" }).first(),
    ).toBeVisible();
    // The toolbar with search and primary action.
    await expect(page.locator(".c-toolbar").first()).toBeVisible();
    // Tabs with counts.
    await expect(
      page.locator(".c-tabs__tab[aria-selected='true']").first(),
    ).toBeVisible();
    // Pagination at the bottom.
    await expect(
      page.locator(".c-pagination").first(),
    ).toBeVisible();
    // Skeleton loading state.
    await expect(page.locator(".c-skeleton").first()).toBeVisible();
  });

  test("tabs page renders tablist and panels", async ({ page }) => {
    await page.goto("./preview/tabs");
    await expect(
      page.getByRole("heading", { name: "Tabs", exact: true }),
    ).toBeVisible();
    // The selected tab is visible.
    const selected = page.locator(".c-tabs__tab[aria-selected='true']").first();
    await expect(selected).toBeVisible();
    await expect(await selected.textContent()).toContain("Overview");
    // A disabled tab exists.
    await expect(page.locator(".c-tabs__tab[disabled]")).toBeDisabled();
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
    const groups = page.locator(".c-toolbar__group");
    expect(await groups.count()).toBeGreaterThanOrEqual(2);
    // A divider exists.
    await expect(page.locator(".c-toolbar__divider").first()).toBeVisible();
  });

  test("pagination renders active page and nav buttons", async ({ page }) => {
    await page.goto("./preview/pagination");
    await expect(
      page.getByRole("heading", { name: "Pagination", exact: true }),
    ).toBeVisible();
    // The active page carries aria-current.
    await expect(
      page.locator(".c-pagination__page[aria-current='page']").first(),
    ).toBeVisible();
    // Prev is disabled on page 1.
    await expect(
      page.locator(".c-pagination__nav").first(),
    ).toBeDisabled();
    // An ellipsis exists.
    await expect(page.locator(".c-pagination__ellipsis").first()).toBeVisible();
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
    const up = page.locator(".c-stat__trend[data-direction='up']").first();
    await expect(up).toBeVisible();
    // A sparkline SVG exists.
    await expect(page.locator(".c-stat__spark svg").first()).toBeVisible();
  });

  test("skeleton renders text, circle, and rect shapes", async ({ page }) => {
    await page.goto("./preview/skeleton");
    await expect(
      page.getByRole("heading", { name: "Skeleton", exact: true }),
    ).toBeVisible();
    // Text shape (default).
    await expect(page.locator(".c-skeleton[data-shape='text']").first()).toBeVisible();
    // Circle shape.
    await expect(page.locator(".c-skeleton[data-shape='circle']").first()).toBeVisible();
    // Rect shape.
    await expect(page.locator(".c-skeleton[data-shape='rect']").first()).toBeVisible();
  });

  test("empty state renders title, description, and actions", async ({ page }) => {
    await page.goto("./preview/empty-state");
    await expect(
      page.getByRole("heading", { name: "Empty state", exact: true }),
    ).toBeVisible();
    // The first empty state has a title.
    await expect(page.getByText("No accounts yet")).toBeVisible();
    // The actions row has a primary button.
    await expect(
      page.locator(".c-empty__actions .c-button[data-variant='primary']").first(),
    ).toBeVisible();
    // The danger tone variant exists.
    await expect(page.locator(".c-empty[data-tone='danger']")).toBeVisible();
  });

  test("alert renders every tone with title and body", async ({ page }) => {
    await page.goto("./preview/alert");
    await expect(
      page.getByRole("heading", { name: "Alert", exact: true }),
    ).toBeVisible();
    for (const tone of ["success", "warning", "danger"]) {
      await expect(
        page.locator(`.c-alert[data-tone='${tone}']`).first(),
      ).toBeVisible();
    }
    await expect(page.locator(".c-alert:not([data-tone])").first()).toBeVisible();
    await expect(page.locator(".c-alert__icon svg").first()).toBeVisible();
  });

  test("progress renders determinate and indeterminate", async ({ page }) => {
    await page.goto("./preview/progress");
    await expect(
      page.getByRole("heading", { name: "Progress", exact: true }),
    ).toBeVisible();
    const bars = page.locator(".c-progress__bar");
    expect(await bars.count()).toBeGreaterThanOrEqual(2);
    await expect(
      page.locator(".c-progress[data-indeterminate]"),
    ).toBeVisible();
    await expect(
      page.locator(".c-progress[data-tone='danger']"),
    ).toBeVisible();
  });

  test("avatar renders initials, image, and group", async ({ page }) => {
    await page.goto("./preview/avatar");
    await expect(
      page.getByRole("heading", { name: "Avatar", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-avatar[data-size='sm']").first()).toBeVisible();
    await expect(page.locator(".c-avatar[data-size='lg']").first()).toBeVisible();
    await expect(page.locator(".c-avatar__img").first()).toBeVisible();
    await expect(page.locator(".c-avatar-group").first()).toBeVisible();
    await expect(page.locator(".c-avatar-group__more")).toBeVisible();
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
    await expect(content.getByText("@layer porchlight, app")).toBeVisible();
  });

  test("theming guide covers tokens and density", async ({ page }) => {
    await page.goto("./guides/theming");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Theming", exact: true }),
    ).toBeVisible();
    await expect(content.getByText("data-density").first()).toBeVisible();
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

  test("color token reference shows semantic pairs", async ({ page }) => {
    await page.goto("./tokens/color");
    const content = page.locator(".docs-content");
    await expect(
      content.getByRole("heading", { name: "Color Tokens", exact: true }),
    ).toBeVisible();
    await expect(content.getByText("--pl-color-accent", { exact: true })).toBeVisible();
    await expect(content.getByText("--pl-color-bg", { exact: true })).toBeVisible();
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
      content.getByRole("heading", { name: "Spacing, Radius & Motion Tokens", exact: true }),
    ).toBeVisible();
    await expect(content.getByText("--pl-space-4", { exact: true }).first()).toBeVisible();
    await expect(content.getByText("--pl-z-toast").first()).toBeVisible();
  });

  test("homepage shows feature highlights and stats", async ({ page }) => {
    await page.goto("./");
    await expect(
      page.getByRole("heading", { name: "Porchlight", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Zero JavaScript")).toBeVisible();
    await expect(page.getByText("WCAG-AA verified")).toBeVisible();
    await expect(page.getByText("pnpm add @cawalch/porchlight")).toBeVisible();
  });

  test("tooltip renders trigger and tooltip body", async ({ page }) => {
    await page.goto("./preview/tooltip");
    await expect(
      page.getByRole("heading", { name: "Tooltip", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-tooltip__trigger").first()).toBeVisible();
    await expect(page.locator(".c-tooltip__body").first()).toHaveAttribute(
      "role",
      "tooltip",
    );
  });

  test("accordion renders details and summary", async ({ page }) => {
    await page.goto("./preview/accordion");
    await expect(
      page.getByRole("heading", { name: "Accordion", exact: true }),
    ).toBeVisible();
    const items = page.locator(".c-accordion__item");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".c-accordion__icon").first()).toBeVisible();
    // The open-by-default item exists.
    await expect(page.locator(".c-accordion__item[open]")).toBeVisible();
  });

  test("switch renders tracks and thumbs", async ({ page }) => {
    await page.goto("./preview/switch");
    await expect(
      page.getByRole("heading", { name: "Switch", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-switch__track").first()).toBeVisible();
    await expect(page.locator(".c-switch__thumb").first()).toBeVisible();
    await expect(page.locator(".c-switch[data-size='sm']").first()).toBeVisible();
    await expect(page.locator(".c-switch[data-size='lg']").first()).toBeVisible();
  });

  test("chip renders all tones and remove buttons", async ({ page }) => {
    await page.goto("./preview/chip");
    await expect(
      page.getByRole("heading", { name: "Chip", exact: true }),
    ).toBeVisible();
    for (const tone of ["success", "warning", "danger"]) {
      await expect(
        page.locator(`.c-chip[data-tone='${tone}']`).first(),
      ).toBeVisible();
    }
    await expect(page.locator(".c-chip__remove").first()).toBeVisible();
    await expect(page.locator(".c-chip-group").first()).toBeVisible();
  });

  test("drawer renders with popover and side variants", async ({ page }) => {
    await page.goto("./preview/drawer");
    await expect(
      page.getByRole("heading", { name: "Drawer", exact: true }),
    ).toBeVisible();
    // The drawer elements exist with popover attribute.
    await expect(page.locator(".c-drawer[popover]").first()).toBeAttached();
    // Both side variants exist.
    await expect(page.locator(".c-drawer[data-side='start']")).toBeAttached();
    await expect(page.locator(".c-drawer[data-side='end']")).toBeAttached();
    // Drawer has header, body, footer.
    await expect(page.locator(".c-drawer__header").first()).toBeAttached();
    await expect(page.locator(".c-drawer__body").first()).toBeAttached();
  });

  test("toast renders tones and close buttons", async ({ page }) => {
    await page.goto("./preview/toast");
    await expect(
      page.getByRole("heading", { name: "Toast", exact: true }),
    ).toBeVisible();
    // Toast stack exists.
    await expect(page.locator(".c-toast-stack")).toBeVisible();
    // All tones present.
    for (const tone of ["success", "warning", "danger"]) {
      await expect(
        page.locator(`.c-toast[data-tone='${tone}']`),
      ).toBeVisible();
    }
    // Default (no tone) toast exists.
    await expect(page.locator(".c-toast:not([data-tone])")).toBeVisible();
    // Close buttons exist.
    await expect(page.locator(".c-toast__close").first()).toBeVisible();
  });

  test("scroll-progress bar and reveal sections exist", async ({ page }) => {
    await page.goto("./preview/scroll-progress");
    await expect(
      page.getByRole("heading", { name: "Scroll Progress", exact: true }),
    ).toBeVisible();
    // The progress bar element is attached.
    await expect(page.locator(".c-scroll-progress")).toBeAttached();
    // Reveal sections exist.
    const reveals = page.locator(".c-reveal");
    expect(await reveals.count()).toBeGreaterThanOrEqual(4);
    // Delay variants exist.
    await expect(page.locator(".c-reveal[data-delay='1']")).toBeAttached();
    await expect(page.locator(".c-reveal[data-delay='3']")).toBeAttached();
  });

  test("breadcrumb renders trail with current page", async ({ page }) => {
    await page.goto("./preview/breadcrumb");
    await expect(
      page.getByRole("heading", { name: "Breadcrumb", exact: true }),
    ).toBeVisible();
    // Links exist.
    await expect(page.locator(".c-breadcrumb__link").first()).toBeVisible();
    // Current page exists.
    await expect(page.locator(".c-breadcrumb__current").first()).toBeVisible();
    // Multiple items (trail).
    const items = page.locator(".c-breadcrumb__item");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
  });

  test("stepper renders steps with all states", async ({ page }) => {
    await page.goto("./preview/stepper");
    await expect(
      page.getByRole("heading", { name: "Stepper", exact: true }),
    ).toBeVisible();
    // All three states exist.
    await expect(page.locator(".c-stepper__step[data-state='completed']").first()).toBeVisible();
    await expect(page.locator(".c-stepper__step[data-state='current']").first()).toBeVisible();
    await expect(page.locator(".c-stepper__step[data-state='upcoming']").first()).toBeVisible();
    // Markers exist.
    await expect(page.locator(".c-stepper__marker").first()).toBeVisible();
  });

  test("timeline renders items with dots and content", async ({ page }) => {
    await page.goto("./preview/timeline");
    await expect(
      page.getByRole("heading", { name: "Timeline", exact: true }),
    ).toBeVisible();
    const items = page.locator(".c-timeline__item");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".c-timeline__dot").first()).toBeVisible();
    await expect(page.locator(".c-timeline__title").first()).toBeVisible();
    // Tone variant exists.
    await expect(page.locator(".c-timeline__item[data-tone='success']")).toBeVisible();
  });

  test("textarea-auto renders with field-sizing", async ({ page }) => {
    await page.goto("./preview/textarea-auto");
    await expect(
      page.getByRole("heading", { name: "Auto-Growing Textarea", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-textarea-auto").first()).toBeVisible();
    // Disabled variant exists.
    await expect(page.locator(".c-textarea-auto[disabled]")).toBeVisible();
  });

  test("segmented control renders radio groups with checked state", async ({
    page,
  }) => {
    await page.goto("./preview/segmented");
    await expect(
      page.getByRole("heading", { name: "Segmented control", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-segmented").first()).toBeVisible();
    // Multiple radiogroups.
    const groups = page.locator("[role='radiogroup']");
    expect(await groups.count()).toBeGreaterThanOrEqual(3);
    // Checked items exist.
    await expect(page.locator(".c-segmented__item input:checked").first()).toBeAttached();
    // Disabled item exists.
    await expect(page.locator(".c-segmented__item input:disabled")).toBeAttached();
  });

  test("tag input renders chips and inline field", async ({ page }) => {
    await page.goto("./preview/tag-input");
    await expect(
      page.getByRole("heading", { name: "Tag input", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-tag-input").first()).toBeVisible();
    await expect(page.locator(".c-tag-input__field").first()).toBeVisible();
    await expect(page.locator(".c-tag-input .c-chip").first()).toBeVisible();
    await expect(page.locator(".c-chip__remove").first()).toBeVisible();
  });

  test("dropdown renders trigger and menu options", async ({ page }) => {
    await page.goto("./preview/dropdown");
    await expect(
      page.getByRole("heading", { name: "Dropdown", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-dropdown__trigger").first()).toBeVisible();
    await expect(page.locator(".c-dropdown__chevron").first()).toBeVisible();
    // Menus exist with popover attr.
    await expect(page.locator(".c-dropdown__menu[popover]").first()).toBeAttached();
    // Options exist.
    await expect(page.locator(".c-dropdown__option").first()).toBeAttached();
  });

  test("file upload renders zone with hidden input", async ({ page }) => {
    await page.goto("./preview/file-upload");
    await expect(
      page.getByRole("heading", { name: "File upload", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-file-upload__zone").first()).toBeVisible();
    await expect(page.locator(".c-file-upload__input").first()).toHaveAttribute(
      "type",
      "file",
    );
    // Disabled variant exists.
    await expect(page.locator(".c-file-upload__input[disabled]")).toBeAttached();
  });

  test("command palette renders popover with search and items", async ({
    page,
  }) => {
    await page.goto("./preview/command-palette");
    await expect(
      page.getByRole("heading", { name: "Command palette", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".c-command[popover]")).toBeAttached();
    await expect(page.locator(".c-command__search")).toBeAttached();
    await expect(page.locator(".c-command__item").first()).toBeAttached();
    await expect(page.locator(".c-command__heading").first()).toBeAttached();
    // Footer exists (may be hidden since popover is closed).
    await expect(page.locator(".c-command__footer")).toBeAttached();
  });
});

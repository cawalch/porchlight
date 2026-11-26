import { expect, test } from "@playwright/test";

/**
 * Docs chrome regressions that the 390/1440 reading pass cannot see:
 * the in-between header breakpoint, light-dismiss for native disclosures,
 * and the affordances that explain clipped tables and inline examples.
 */

test("docs header keeps one row from mobile through desktop", async ({
  page,
}) => {
  for (const width of [390, 768, 800, 846, 900, 959, 1023, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./components/button");

    const header = await page.locator(".site-header").boundingBox();
    expect(header?.height, `header height at ${width}px`).toBeLessThan(70);

    const search = page.locator(".site-search");
    await expect(search, `search at ${width}px`).toContainText("Search docs");
    expect(
      (await search.boundingBox())?.height,
      `search height at ${width}px`,
    ).toBeLessThan(42);

    const navVisible = width >= 1024;
    await expect(page.locator(".site-nav")).toBeVisible({
      visible: navVisible,
    });
    await expect(page.locator(".site-menu")).toBeVisible({
      visible: !navVisible,
    });
  }
});

test("mobile menu and docs disclosures dismiss on outside click and Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./guides/getting-started");

  const menu = page.locator(".site-menu");
  const isOpen = (locator: typeof menu) =>
    locator.evaluate((element) => (element as HTMLDetailsElement).open);

  await menu.locator("summary").click();
  expect(await isOpen(menu)).toBe(true);
  await page.mouse.click(8, 800);
  await expect.poll(() => isOpen(menu)).toBe(false);

  await menu.locator("summary").click();
  expect(await isOpen(menu)).toBe(true);
  await page.keyboard.press("Escape");
  await expect.poll(() => isOpen(menu)).toBe(false);

  const browse = page.locator(".docs-mobile-navigation");
  await browse.locator("summary").click();
  expect(await isOpen(browse)).toBe(true);
  await page.mouse.click(8, 800);
  await expect.poll(() => isOpen(browse)).toBe(false);
});

test("inline examples advertise scrolling only when their content is taller", async ({
  page,
}) => {
  await page.goto("./components/form");
  await expect(
    page.frameLocator("[data-example] iframe").locator(".pl-c-form").first(),
  ).toBeVisible();
  await expect(page.locator("[data-example]")).toHaveAttribute(
    "data-scrollable",
    "true",
  );
  await expect(page.locator(".docs-example__scroll-hint")).toBeVisible();

  await page.goto("./components/banner");
  await expect(
    page.frameLocator("[data-example] iframe").locator(".pl-c-banner").first(),
  ).toBeVisible();
  await expect(page.locator("[data-example]")).not.toHaveAttribute(
    "data-scrollable",
    "true",
  );
  await expect(page.locator(".docs-example__scroll-hint")).toBeHidden();
});

test("token tables fit the desktop reading column and wrap long values", async ({
  page,
}) => {
  await page.goto("./tokens/typography");

  const overflows = await page
    .locator(".prose table")
    .evaluateAll((tables) =>
      tables.map((table) => table.scrollWidth - table.clientWidth),
    );
  expect(Math.max(...overflows)).toBeLessThanOrEqual(2);

  const captionAlign = await page
    .locator(".prose caption")
    .first()
    .evaluate((element) => getComputedStyle(element).textAlign);
  expect(["start", "left"]).toContain(captionAlign);

  await page.goto("./guides/dialog-and-popover");
  const codeSize = await page
    .locator(".prose th code")
    .first()
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(codeSize).toBeGreaterThanOrEqual(12);
});

test("wide prose tables explain the clipped columns", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("./guides/browser-support");

  const table = page.locator(".prose table").first();
  expect(
    await table.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeGreaterThan(2);
  await expect(table).toHaveAttribute("data-scrollable", "true");

  const hint = page.locator(".docs-table-hint").first();
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText(/scroll horizontally/i);
});

test("each page links its full example once", async ({ page }) => {
  for (const [route, count] of [
    ["./tokens/color", 1],
    ["./components/card", 1],
    ["./guides/why-porchlight", 0],
  ] as const) {
    await page.goto(route);
    const previewLinks = page.locator(
      '.docs-example-link, .docs-example figcaption a[href*="/preview/"], .docs-page-links a[href*="/preview/"]',
    );
    await expect(previewLinks, route).toHaveCount(count);
    await expect(
      page.locator('.docs-page-links a[href*="/preview/"]'),
      `${route} footer`,
    ).toHaveCount(0);
  }
});

test("unknown routes render the docs 404 shell", async ({ page }) => {
  const response = await page.goto("./definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Page not found");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse guides" })).toBeVisible();

  await page.getByRole("button", { name: /Search docs/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Search Porchlight" }),
  ).toBeVisible();
});

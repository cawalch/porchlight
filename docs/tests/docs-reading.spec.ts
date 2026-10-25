import { expect, test } from "@playwright/test";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { previewRoutes, previewRedirectRoutes } from "./lib/preview-routes";

const docsRoutes = ["guides", "components", "tokens"].flatMap((collection) =>
  readdirSync(
    fileURLToPath(new URL(`../src/content/${collection}/`, import.meta.url)),
  )
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => `/${collection}/${file.slice(0, -4)}`),
);
docsRoutes.push("/guides/", "/tokens/", "/components/");
const routes = [
  ...new Set(["/", ...docsRoutes, ...previewRoutes, ...previewRedirectRoutes]),
];

for (const width of [390, 1440]) {
  test(`all published layouts stay readable at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(`.${route}`);
      await expect(page.locator("#main")).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect
        .soft(
          overflow,
          `${route} must contain horizontal scrolling within its examples`,
        )
        .toBeLessThanOrEqual(1);
      if (!docsRoutes.includes(route)) continue;
      expect
        .soft(
          (await page.locator(".prose p").allTextContents()).map((text) =>
            text.trim(),
          ),
          `${route} must keep punctuation in its sentence`,
        )
        .not.toContain(".");
      await expect.soft(page.locator("h1"), route).toHaveCount(1);
      const title = await page.locator("h1").boundingBox();
      expect
        .soft(title!.y, `${route} title should be in the first screen`)
        .toBeLessThan(350);
      const sections = await page
        .locator(".prose h2[id], .prose h3[id]")
        .count();
      await expect
        .soft(
          page.locator(".docs-contents .docs-toc a"),
          `${route} contents must include every section`,
        )
        .toHaveCount(sections);
      const paragraph = page.locator(".prose p").first();
      if (await paragraph.count()) {
        expect
          .soft(
            await paragraph.evaluate((p) =>
              parseFloat(getComputedStyle(p).marginBlockEnd),
            ),
            `${route} needs shared prose spacing`,
          )
          .toBeGreaterThan(0);
      }
    }
  });
}

test("contents and search survive navigation and find CSS identifiers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./components/button");
  const links = await page
    .locator(".docs-sidebar a")
    .evaluateAll((items) => items.map((item) => item.getAttribute("href")));
  await page.locator('.docs-sidebar a[href$="/components/field"]').click();
  await expect(page.locator("h1")).toHaveText("Field");
  await expect(page.locator(".docs-contents .docs-toc a")).toHaveCount(18);
  expect(
    await page
      .locator(".docs-sidebar a")
      .evaluateAll((items) => items.map((item) => item.getAttribute("href"))),
  ).toEqual(links);
  await page.locator('.docs-contents a[href="#accessibility"]').click();
  const target = await page.locator("#accessibility").boundingBox();
  const header = await page.locator(".site-header").boundingBox();
  expect(target!.y).toBeGreaterThanOrEqual(header!.height);
  await page.getByRole("button", { name: "Search docs", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Search Porchlight" });
  await dialog.getByLabel("Search docs").fill(".pl-c-card");
  await expect(
    dialog.locator('a[href$="/components/card"]').first(),
  ).toBeVisible();
  await dialog.getByLabel("Search docs").fill("--pl-shadow-1");
  await expect(
    dialog.getByRole("link", { name: /^--pl-shadow-1/ }),
  ).toBeVisible();
});

test("embedded examples retain real control sizes without site navigation", async ({
  page,
}) => {
  await page.goto("./components/card");
  const frame = page.frameLocator(".docs-example iframe");
  await expect(frame.locator(".site-header")).toBeHidden();
  await expect(frame.locator(".pl-c-card").first()).toBeVisible();
  expect(
    await frame
      .locator(".pl-c-card")
      .first()
      .evaluate((card) => parseFloat(getComputedStyle(card).fontSize)),
  ).toBeGreaterThanOrEqual(14);
  await expect(page.locator(".docs-example iframe")).toHaveCSS(
    "transform",
    "none",
  );
});

test("only the preview section is current on the token example", async ({
  page,
}) => {
  await page.goto("./preview/tokens");
  await expect(page.locator('.site-nav [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.site-nav [aria-current="page"]')).toHaveText(
    "Examples",
  );
});

test("mobile navigation works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}components/button`);
  await page.locator(".docs-mobile-navigation summary").click();
  await page
    .locator('.docs-mobile-navigation a[href$="/components/field"]')
    .click();
  await expect(page.locator("h1")).toHaveText("Field");
  await page.locator(".docs-mobile-contents summary").click();
  await expect(
    page.locator('.docs-mobile-contents a[href="#accessibility"]'),
  ).toBeVisible();
  await context.close();
});

test("documentation reflows at 200% zoom with useful reading width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./components/button");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const metrics = await page.evaluate(() => ({
    width: document.querySelector(".docs-content")!.getBoundingClientRect()
      .width,
    overflow:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
    sidebar: getComputedStyle(document.querySelector(".docs-sidebar")!).display,
  }));
  expect(metrics.width).toBeGreaterThan(600);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(metrics.sidebar).toBe("none");
});

for (const [name, route] of [
  ["button", "components/button"],
  ["guides", "guides/"],
  ["color", "tokens/color"],
] as const) {
  for (const width of [390, 1440]) {
    test(`documentation appearance: ${name} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`./${route}`);
      await expect(page).toHaveScreenshot(`docs-${name}-${width}.png`, {
        animations: "disabled",
        // Match the existing macOS/Linux font-rasterization allowance. The
        // route checks above independently enforce geometry and navigation.
        maxDiffPixelRatio: 0.09,
      });
    });
  }
}

test("documentation appearance: dark and RTL", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./components/button");
  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
  });
  await expect(page).toHaveScreenshot("docs-button-dark-rtl.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.09,
  });
});

test("documentation navigation retains focus indicators in forced colors", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("./components/button");
  const search = page.getByRole("button", { name: "Search docs", exact: true });
  await search.focus();
  const style = await search.evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(style).toBe("solid");
  await search.click();
  await expect(
    page.getByRole("dialog", { name: "Search Porchlight" }),
  ).toBeVisible();
});

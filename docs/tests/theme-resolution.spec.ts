import { test, expect } from "@playwright/test";

/**
 * Audit probe: does toggling [data-theme] on a NESTED element actually flip
 * the --pl-* semantic colors? The tokens are defined on :root with light-dark();
 * the themes playground sets data-theme on a nested .playground div. This
 * verifies light-dark() resolves per-element (not frozen at :root).
 */
test("nested [data-theme] flips the semantic color tokens", async ({
  page,
}) => {
  await page.goto("./preview/themes");
  const playground = page.locator(".playground");

  const light = await playground.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.getByRole("button", { name: "dark" }).click();
  const dark = await playground.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );

  console.log("LIGHT rendered bg:", light);
  console.log("DARK  rendered bg:", dark);
  expect(light).not.toBe(dark);
});

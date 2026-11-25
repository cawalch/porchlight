import { expect, test } from "@playwright/test";

/**
 * Reduced-motion guard (#225 / #238):
 * Under prefers-reduced-motion: reduce, no element in the built bundle
 * (including .pl-c-tabs__list and .pl-c-miller-columns) may resolve
 * scroll-behavior: smooth.
 */

test("prefers-reduced-motion: reduce stops smooth scrolling on all elements", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of ["./preview/tabs", "./preview/miller-columns"]) {
    await page.goto(route);
    const smoothElements = await page.evaluate(() => {
      const hits: string[] = [];
      for (const el of document.querySelectorAll("*")) {
        if (getComputedStyle(el).scrollBehavior === "smooth") {
          hits.push(`${el.tagName.toLowerCase()}.${el.className}`);
        }
      }
      return hits;
    });
    expect(smoothElements, `smooth scroll elements on ${route}`).toEqual([]);
  }
});

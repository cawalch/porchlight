import { expect, test } from "@playwright/test";

const route = "./preview/scroll-progress";

test("built CSS advances the progress bar with root scroll", async ({
  page,
}) => {
  await page.goto(route);
  expect(
    await page.evaluate(() => CSS.supports("animation-timeline: scroll()")),
  ).toBe(true);

  const bar = page.locator(".pl-c-scroll-progress");
  await expect(bar).toHaveCSS("animation-name", "pl-c-scroll-progress-grow");
  await expect(bar).toHaveCSS("animation-timeline", "scroll(root)");

  const scale = () =>
    bar.evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
    );
  expect(await scale()).toBeLessThan(0.1);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect.poll(scale).toBeGreaterThan(0.9);
});

test("built CSS reveals content but leaves it visible under reduced motion", async ({
  page,
}) => {
  await page.goto(route);
  expect(
    await page.evaluate(() => CSS.supports("animation-timeline: view()")),
  ).toBe(true);

  const last = page.locator(".pl-c-reveal").last();
  await expect(last).toHaveCSS("animation-name", "pl-c-reveal-enter");
  await expect(last).toHaveCSS("animation-timeline", "view()");
  expect(
    await last.evaluate((el) => el.getBoundingClientRect().top > innerHeight),
  ).toBe(true);
  await expect(last).toHaveCSS("opacity", "0");
  await last.scrollIntoViewIfNeeded();
  await expect
    .poll(() => last.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeGreaterThan(0.5);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect
    .poll(() =>
      last.evaluate((el) => el.getBoundingClientRect().top > innerHeight),
    )
    .toBe(true);
  await expect(last).toHaveCSS("animation-name", "none");
  await expect(last).toHaveCSS("opacity", "1");
  await expect(last).toHaveCSS("transform", "none");
});

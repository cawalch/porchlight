import { test, expect } from "@playwright/test";

/**
 * Audit probe: does toggling [data-pl-theme] on a NESTED element actually flip
 * the --pl-* semantic colors? The tokens are defined on :root with light-dark();
 * the themes playground sets data-pl-theme on a nested .playground div. This
 * verifies light-dark() resolves per-element (not frozen at :root).
 */
test("nested [data-pl-theme] flips the semantic color tokens", async ({
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

/**
 * Regression guard: the derived accent states must exist even when the page
 * does NOT opt into a [data-pl-palette] preset. They also must be re-declared
 * on palette containers so a scoped palette recomputes them from its accent.
 */
test("derived accent tokens resolve without [data-pl-palette]", async ({
  page,
}) => {
  await page.goto("./preview/base");

  const root = await page.evaluate(() => {
    const el = document.documentElement;
    const cs = getComputedStyle(el);
    return {
      hasPalette: el.hasAttribute("data-pl-palette"),
      hover: cs.getPropertyValue("--pl-color-accent-hover").trim(),
      subtle: cs.getPropertyValue("--pl-color-accent-subtle").trim(),
      glow: cs.getPropertyValue("--pl-shadow-glow").trim(),
    };
  });

  expect(root.hasPalette, "preview/base must not set a palette").toBe(false);
  expect(root.hover, "--pl-color-accent-hover must resolve").not.toBe("");
  expect(root.subtle, "--pl-color-accent-subtle must resolve").not.toBe("");
  expect(root.glow, "--pl-shadow-glow must resolve").not.toBe("");

  const scoped = await page.evaluate(() => {
    const el = document.createElement("div");
    el.setAttribute("data-pl-palette", "emerald");
    document.body.append(el);
    const cs = getComputedStyle(el);
    return {
      hover: cs.getPropertyValue("--pl-color-accent-hover").trim(),
      subtle: cs.getPropertyValue("--pl-color-accent-subtle").trim(),
      glow: cs.getPropertyValue("--pl-shadow-glow").trim(),
    };
  });

  expect(scoped.hover, "scoped palette hover must resolve").not.toBe("");
  expect(scoped.subtle, "scoped palette subtle must resolve").not.toBe("");
  expect(scoped.glow, "scoped palette glow must resolve").not.toBe("");
  expect(scoped.hover).not.toBe(root.hover);
  expect(scoped.subtle).not.toBe(root.subtle);
  expect(scoped.glow).not.toBe(root.glow);
});

test("every palette preset remaps --pl-color-text-faint", async ({ page }) => {
  await page.goto("./preview/base");

  const state = await page.evaluate(() => {
    const rootValue = getComputedStyle(document.documentElement)
      .getPropertyValue("--pl-color-text-faint")
      .trim();
    const palettes = [
      "slate",
      "zinc",
      "midnight",
      "emerald",
      "amethyst",
      "crimson",
      "cyan",
    ];
    return {
      root: rootValue,
      palettes: palettes.map((palette) => {
        const el = document.createElement("div");
        el.setAttribute("data-pl-palette", palette);
        document.body.append(el);
        const value = getComputedStyle(el)
          .getPropertyValue("--pl-color-text-faint")
          .trim();
        el.remove();
        return { palette, value };
      }),
    };
  });

  expect(state.root).not.toBe("");
  for (const { palette, value } of state.palettes) {
    expect(value, `${palette} must define --pl-color-text-faint`).not.toBe("");
    expect(value, `${palette} must remap --pl-color-text-faint`).not.toBe(
      state.root,
    );
  }
});

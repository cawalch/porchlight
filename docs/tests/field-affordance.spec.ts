import { test, expect } from "@playwright/test";
import { deltaL } from "./lib/color";

/**
 * Field affordance guard — same rigor as the button affordance test.
 *
 * A field's state must be perceptually distinct from its default. The classic
 * failure is a focus state that only swaps a 1px border color to a near-identical
 * shade (invisible affordance). This asserts both:
 *   - focus: the control's border-color (which flips to --pl-focus-color) shifts
 *     by a clear perceptual step from the default border.
 *   - invalid: the danger border reads as different from the neutral default.
 *
 * Reads the control's computed border-color directly — the simplest robust probe.
 */

const STATE_DL = 0.03;

test("field focus border is perceptibly distinct from default", async ({
  page,
}) => {
  await page.goto("./preview/field");
  // :focus-visible requires KEYBOARD focus, not programmatic .focus(). Tab into
  // the real first field on the page — the actual user path.
  const input = page.locator(".c-field__control").first();
  const def = await input.evaluate(
    (el) => getComputedStyle(el).borderLeftColor,
  );
  await input.focus();
  await page.keyboard.press("Tab");
  // Tab moved away; focus the field again via keyboard.
  await page.keyboard.press("Shift+Tab");
  // Wait for the 120ms border-color transition to settle before reading.
  await page.waitForTimeout(300);
  const focused = await input.evaluate(
    (el) => getComputedStyle(el).borderLeftColor,
  );
  const dl = deltaL(def, focused);
  console.log(
    `[field] default border=${def} focus border=${focused} ΔL=${dl.toFixed(4)}`,
  );
  expect(
    dl,
    `field focus border must differ from default by ≥ ${STATE_DL}`,
  ).toBeGreaterThanOrEqual(STATE_DL);
});

test("field invalid border is perceptibly distinct from default", async ({
  page,
}) => {
  await page.goto("./preview/field");
  // The page's URL field (third demo) is type=url + required. Type invalid
  // text and blur — :user-invalid fires on real interaction (programmatic
  // checkValidity() alone does NOT set it).
  const urlField = page.locator(".c-field__control[type='url']");
  const def = await urlField.evaluate(
    (el) => getComputedStyle(el).borderLeftColor,
  );
  await urlField.fill("not-a-url");
  await urlField.blur();
  // Wait for the border-color transition to settle.
  await page.waitForTimeout(300);
  const invalid = await urlField.evaluate(
    (el) => getComputedStyle(el).borderLeftColor,
  );
  const dl = deltaL(def, invalid);
  console.log(
    `[field] default border=${def} invalid border=${invalid} ΔL=${dl.toFixed(4)}`,
  );
  expect(
    dl,
    `field invalid border must differ from default by ≥ ${STATE_DL}`,
  ).toBeGreaterThanOrEqual(STATE_DL);
});

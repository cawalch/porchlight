import { test, expect } from "@playwright/test";
import { deltaL, toOklab } from "./lib/color";

/**
 * Field affordance guard — same rigor as the button affordance test.
 *
 * The focus/invalid indicator is a box-shadow RING around the control (not a
 * border-color change). This asserts the ring is present and uses the focus /
 * danger color at a clearly perceptible lightness step from the page surface —
 * i.e. the indicator is actually visible, not a faint veil. It also guards
 * against the previous bug where `0 0 0 4px` (no blur) read as a hard
 * translucent "second stroke" beside the border.
 */

const RING_DL = 0.25; // ring color must differ from a neutral surface by ≥25% L

/** Extract the first color from a computed box-shadow string ("none" → null). */
function ringColor(boxShadow: string): string | null {
  if (!boxShadow || boxShadow === "none") return null;
  // Chrome serializes each shadow layer; the first color token is the ring.
  const ok = boxShadow.match(/oklch\([^)]+\)|oklab\([^)]+\)|rgba?\([^)]+\)/);
  return ok ? ok[0] : null;
}

test("field focus draws a visible accent ring", async ({ page }) => {
  await page.goto("./preview/field");
  // The page surface behind the control.
  const surface = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  const input = page.locator(".c-field__control").first();

  // Default: no ring.
  const defRing = await input.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(defRing, "default field must have no ring").toBe("none");

  // :focus-visible requires KEYBOARD focus (not programmatic .focus()).
  await input.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  // Wait for the box-shadow transition to settle before reading.
  await page.waitForTimeout(300);

  const focusRing = await input.evaluate(
    (el) => getComputedStyle(el).boxShadow,
  );
  const color = ringColor(focusRing);
  expect(color, "focus must draw a ring").not.toBeNull();
  const dl = deltaL(color!, surface);
  console.log(
    `[field] focus ring=${color} surface=${surface} ΔL=${dl.toFixed(4)}`,
  );
  expect(
    dl,
    `focus ring must differ from the surface by ≥ ${RING_DL}`,
  ).toBeGreaterThanOrEqual(RING_DL);
  // Sanity: the ring color is in the focus-color family (low a/b toward blue,
  // not neutral gray).
  const lab = toOklab(color!);
  expect(lab.a, "ring is not neutral (has chroma)").toBeLessThan(-0.01);
});

test("field invalid draws a visible danger ring", async ({ page }) => {
  await page.goto("./preview/field");
  const surface = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  // The page's URL field is type=url + required. Type invalid text and blur —
  // :user-invalid fires on real interaction (checkValidity() alone won't set it).
  const urlField = page.locator(".c-field__control[type='url']");
  await urlField.fill("not-a-url");
  await urlField.blur();
  await page.waitForTimeout(300);

  const ring = await urlField.evaluate((el) => getComputedStyle(el).boxShadow);
  const color = ringColor(ring);
  expect(color, "invalid must draw a ring").not.toBeNull();
  const dl = deltaL(color!, surface);
  console.log(
    `[field] invalid ring=${color} surface=${surface} ΔL=${dl.toFixed(4)}`,
  );
  expect(
    dl,
    `invalid ring must differ from the surface by ≥ ${RING_DL}`,
  ).toBeGreaterThanOrEqual(RING_DL);
});

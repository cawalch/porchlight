import { test, expect } from "@playwright/test";

test.describe("SOTA Form Capabilities (v0.15.0)", () => {
  test.describe("Anchor-positioned validation balloon", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./preview/field");
    });

    test("displays anchor balloon when aria-invalid is true", async ({
      page,
    }) => {
      const field = page.locator("[data-preview-anchor-balloon]");
      const balloon = field.locator(".pl-c-field__balloon");
      const input = field.locator(".pl-c-field__control");

      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(balloon).toBeVisible();
      await expect(balloon).toContainText("Token must begin with");

      // Verify anchor styling where supported
      const hasAnchorSupport = await page.evaluate(() =>
        CSS.supports("position-anchor: --x"),
      );
      if (hasAnchorSupport) {
        const balloonStyle = await balloon.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            position: s.position,
            positionArea: s.getPropertyValue("position-area") || s.positionArea,
          };
        });
        expect(balloonStyle.position).toBe("fixed");
      }
    });

    test("interactive validation balloon triggers on invalid input interaction", async ({
      page,
    }) => {
      const field = page.locator("[data-preview-interactive-balloon]");
      const input = field.locator(".pl-c-field__control");
      const balloon = field.locator(".pl-c-field__balloon");

      // Initially valid/pristine: balloon should be hidden
      await expect(balloon).toBeHidden();

      // Type 1 character (invalid for minlength="3") and blur to trigger :user-invalid
      await input.fill("a");
      await input.blur();

      // Balloon should now be visible
      await expect(balloon).toBeVisible();
      await expect(balloon).toContainText("at least 3 characters");

      // Fill with valid input (>= 3 chars) and blur
      await input.fill("valid-subdomain");
      await input.blur();

      // Balloon should hide
      await expect(balloon).toBeHidden();
    });

    test("balloon remains legible in dark mode and RTL", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dataset.plTheme = "dark";
        document.documentElement.dir = "rtl";
      });

      const balloon = page.locator(
        "[data-preview-anchor-balloon] .pl-c-field__balloon",
      );
      await expect(balloon).toBeVisible();

      const box = await balloon.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(50);
      expect(box!.height).toBeGreaterThan(15);
    });
  });

  test.describe("Pure-CSS conditional field disclosure", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./preview/form");
    });

    test("smoothly reveals nested fields when switch is checked without JS", async ({
      page,
    }) => {
      const group = page.locator("[data-preview-conditional-switch]");
      const switchLabel = group.locator(".pl-c-switch");
      const switchInput = group.locator(".pl-c-switch__input");
      const conditional = group.locator(".pl-c-form__conditional");
      const urlInput = group.locator("#webhook-url");

      // Initially unchecked: conditional should be collapsed & hidden
      await expect(switchInput).not.toBeChecked();
      await expect(conditional).toBeHidden();

      // Click switch label (or check with force: true)
      await switchLabel.click();
      await expect(switchInput).toBeChecked();

      // Conditional section should expand and become visible
      await expect(conditional).toBeVisible();
      await expect(urlInput).toBeVisible();

      // Form control should be interactable
      await urlInput.fill("https://api.acme.example/webhook");
      await expect(urlInput).toHaveValue("https://api.acme.example/webhook");

      // Uncheck switch: should collapse back
      await switchLabel.click();
      await expect(switchInput).not.toBeChecked();
      await expect(conditional).toBeHidden();
    });
  });

  test.describe("Form-level reactive validation cascade", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./preview/form");
    });

    test("illuminates summary banner and submit button when field is invalid", async ({
      page,
    }) => {
      const form = page.locator("[data-preview-reactive-form]");
      const summary = form.locator("[data-preview-summary]");
      const input = form.locator("#org-handle");
      const submitBtn = form.locator('button[type="submit"]');

      // Initially input has value="Org with spaces" and aria-invalid="true"
      await expect(submitBtn).toBeVisible();
      await expect(summary).toBeVisible();
      await expect(summary).toContainText("Please correct the errors");

      // Fix input to satisfy pattern="[a-z0-9-]{3,20}" and clear aria-invalid
      await input.fill("valid-org");
      await input.evaluate((el) => el.removeAttribute("aria-invalid"));
      await input.blur();

      // Form summary should reactively vanish without any JavaScript submit or validation handlers
      await expect(summary).toBeHidden();
    });
  });
});

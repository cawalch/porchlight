import { expect, test } from "@playwright/test";

test.describe("inline loading", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./preview/inline-loading");
  });

  test("exposes a named status and decorative spinner", async ({ page }) => {
    const status = page.getByRole("status");
    await expect(status).toHaveText(/Refreshing invoices/);
    await expect(status.locator(".pl-c-spinner")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("busy actions use native disabled and preserve label width", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: "Save changes" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator(".pl-c-button__label")).toHaveCSS(
      "opacity",
      "0",
    );

    const geometry = await button.evaluate((element) => {
      const spinner = element.querySelector<HTMLElement>(".pl-c-spinner");
      const buttonRect = element.getBoundingClientRect();
      const spinnerRect = spinner?.getBoundingClientRect();
      return (
        spinnerRect && {
          deltaX: Math.abs(
            spinnerRect.left +
              spinnerRect.width / 2 -
              (buttonRect.left + buttonRect.width / 2),
          ),
          deltaY: Math.abs(
            spinnerRect.top +
              spinnerRect.height / 2 -
              (buttonRect.top + buttonRect.height / 2),
          ),
        }
      );
    });
    expect(geometry?.deltaX).toBeLessThan(1);
    expect(geometry?.deltaY).toBeLessThan(1);
  });
});

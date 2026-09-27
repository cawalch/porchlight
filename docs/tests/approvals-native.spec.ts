import { expect, test } from "@playwright/test";

test("scoped workspace transitions keep outside controls interactive", async ({
  page,
  browser,
}) => {
  expect(Number.parseInt(browser.version(), 10)).toBeGreaterThanOrEqual(154);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./preview/app-approvals");
  const workspace = page.locator("#approval-workspace");
  expect(
    await workspace.evaluate(
      (scope) => typeof Reflect.get(scope, "startViewTransition"),
    ),
  ).toBe("function");
  await workspace.evaluate((scope) =>
    scope.style.setProperty("--pl-u-transition-duration", "3s"),
  );
  const request = page.getByRole("button", {
    name: /Design research subscription/,
  });
  await request.click();
  await expect(page.locator("#detail-design")).toBeVisible();
  await expect(request).toBeFocused();
  await expect
    .poll(() =>
      workspace.evaluate((scope) => scope.matches(":active-view-transition")),
    )
    .toBe(true);
  expect(
    await page
      .locator("html")
      .evaluate((root) => root.matches(":active-view-transition")),
  ).toBe(false);
  await page.getByRole("button", { name: "Review checklist" }).click();
  await expect(page.locator("#review-notes")).toBeVisible();
  expect(
    await workspace.evaluate((scope) =>
      scope.matches(":active-view-transition"),
    ),
  ).toBe(true);
  // These actions interrupt the ongoing animation; only the latest render may win.
  await page.getByRole("button", { name: "Approve selected" }).click();
  await expect(page.locator("#approval-count")).toHaveText("2 pending");
  await expect(
    page.getByRole("button", { name: "Undo approval" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Undo approval" }).click();
  await expect(page.locator("#approval-count")).toHaveText("3 pending");
  await expect(
    page.getByRole("button", { name: "Approve selected" }),
  ).toBeFocused();
  await page
    .locator("#approval-filter")
    .evaluate((filter: HTMLSelectElement) => {
      for (const value of ["approved", "pending", "all"]) {
        filter.value = value;
        filter.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  await expect(page.locator("[data-request]:visible")).toHaveCount(3);
  await expect(page.locator("#detail-design")).toBeVisible();
  await expect
    .poll(() =>
      workspace.evaluate((scope) => scope.matches(":active-view-transition")),
    )
    .toBe(false);
  expect(errors).toEqual([]);
});

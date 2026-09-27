import { expect, test } from "@playwright/test";

for (const fallback of ["absent", "reduced-motion"]) {
  test(`approval and undo work with ${fallback} and no scoped API call`, async ({
    page,
  }) => {
    await page.addInitScript((fallback) => {
      Object.defineProperty(Element.prototype, "startViewTransition", {
        configurable: true,
        value:
          fallback === "absent"
            ? undefined
            : () => {
                document.documentElement.dataset.scopedCalled = "true";
                throw new Error("Reduced motion must bypass the API");
              },
      });
    }, fallback);
    if (fallback === "reduced-motion")
      await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("./preview/app-approvals");
    await page.getByRole("button", { name: "Approve selected" }).click();
    await expect(page.locator("#approval-count")).toHaveText("2 pending");
    await page.getByLabel("Show requests").selectOption("approved");
    await expect(page.locator("[data-request]:visible")).toHaveCount(1);
    await page.getByRole("button", { name: "Undo approval" }).click();
    await expect(page.locator("#approval-count")).toHaveText("3 pending");
    await page.getByLabel("Show requests").selectOption("approved");
    await expect(page.locator("#approval-empty-detail")).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-scoped-called",
      "true",
    );
    expect(errors).toEqual([]);
  });
}

test("approvals initialize after Astro navigation and history traversal", async ({
  page,
}) => {
  await page.goto("./preview/");
  await page
    .locator('a.preview-card__main[href$="/preview/app-approvals"]')
    .click();
  await page.getByRole("button", { name: "Review checklist" }).click();
  await expect(page.locator("#review-notes")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Preview index", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await page.getByRole("button", { name: "Approve selected" }).click();
  await expect(page.locator("#approval-count")).toHaveText("2 pending");
});

test("approval cards retain spacing at 390px in dark RTL touch and forced colors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./preview/app-approvals");
  await page.locator("#approvals-app").evaluate((app) => {
    app.setAttribute("dir", "rtl");
    app.setAttribute("data-pl-density", "touch");
    app.setAttribute("data-pl-theme", "dark");
  });
  await page.emulateMedia({ forcedColors: "active" });
  const layout = await page.locator("#approval-workspace").evaluate((scope) => {
    const list = scope.firstElementChild!.getBoundingClientRect();
    const detail = scope.lastElementChild!.getBoundingClientRect();
    return {
      gap: detail.top - list.bottom,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(layout.gap).toBeGreaterThanOrEqual(20);
  expect(layout.overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Approve selected" }).click();
  await expect(page.locator("#approval-count")).toHaveText("2 pending");
});

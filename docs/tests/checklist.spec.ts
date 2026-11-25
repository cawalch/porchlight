import { expect, test } from "@playwright/test";

test("checklist exposes native checkbox, progress, and current-step semantics", async ({
  page,
}) => {
  await page.goto("./preview/checklist");

  const checklist = page.locator(".pl-c-checklist");
  await expect(checklist).toBeVisible();
  await expect(checklist.getByRole("checkbox")).toHaveCount(4);
  await expect(checklist.getByRole("checkbox", { checked: true })).toHaveCount(
    2,
  );

  const progress = checklist.locator("progress");
  expect(
    await progress.evaluate(
      (element) => (element as HTMLProgressElement).value,
    ),
  ).toBe(2);
  await expect(progress).toHaveAttribute("max", "4");
  await expect(progress).toHaveText("2 of 4 complete");
  await expect(checklist.locator('[data-state="current"]')).toHaveCount(1);

  const invite = page.getByLabel(/Invite a teammate/);
  await invite.check();
  const decoration = await page
    .locator('label[for="setup-invite"]')
    .evaluate((label) => getComputedStyle(label).textDecorationLine);
  expect(decoration).toContain("line-through");
});

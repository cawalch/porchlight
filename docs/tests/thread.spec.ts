import { expect, test } from "@playwright/test";

test("thread exposes comments, replies, mentions, and reactions", async ({
  page,
}) => {
  await page.goto("./preview/thread");

  const thread = page.locator(".pl-c-thread").first();
  await expect(thread.locator(".pl-c-comment")).toHaveCount(3);
  await expect(
    thread.locator(".pl-c-thread__replies .pl-c-comment"),
  ).toHaveCount(1);
  await expect(thread.locator(".pl-c-mention")).toContainText("@Jane");

  const reactions = thread.locator(".pl-c-reaction");
  await expect(reactions).toHaveCount(4);
  await expect(
    thread.locator('.pl-c-reaction[aria-pressed="true"]'),
  ).toHaveCount(1);
});

test("resolved threads and inline-edit states keep explicit status", async ({
  page,
}) => {
  await page.goto("./preview/thread");

  const resolved = page.locator('.pl-c-thread[data-pl-resolved="true"]');
  await expect(resolved).toBeVisible();
  await expect(resolved.locator('[data-state="resolved"]')).toHaveCount(1);

  const saving = page.locator('[data-pl-inline-edit][data-state="saving"]');
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await expect(saving.getByRole("status")).toContainText("Saving");

  await expect(
    page.locator('[data-pl-inline-edit][data-state="saved"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-pl-inline-edit][data-state="error"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeEnabled();
});

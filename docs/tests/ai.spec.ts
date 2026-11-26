import { expect, test } from "@playwright/test";

test("AI workspace exposes composer, reasoning, and citation contracts", async ({
  page,
}) => {
  await page.goto("./preview/ai");

  const composer = page.locator(".pl-c-composer");
  await expect(composer).toBeVisible();
  await expect(composer.getByLabel("Ask about this incident")).toBeVisible();
  await expect(composer.getByRole("button", { name: "Send" })).toBeEnabled();
  await expect(composer.getByRole("button", { name: "Stop" })).toBeEnabled();

  const reasoning = page.locator(".pl-c-reasoning");
  await expect(reasoning).toBeVisible();
  await expect(reasoning.getByText("Reasoning complete")).toBeVisible();
  await expect(reasoning.locator(".pl-c-reasoning__step")).toHaveCount(3);
  await expect(
    reasoning.getByRole("button", { name: "Approve" }),
  ).toBeEnabled();
  await expect(reasoning.getByRole("button", { name: "Undo" })).toBeEnabled();

  await expect(page.locator(".pl-c-citation")).toHaveCount(2);
  await expect(page.locator("#source-1")).toHaveCount(1);
  await expect(page.locator("#source-2")).toHaveCount(1);
});

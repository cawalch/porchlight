import { expect, test } from "@playwright/test";

test("desktop documentation atlas presents peer sections at one height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 2048, height: 900 });
  await page.goto("./components/data-table");

  const sections = page.locator(".docs-atlas__section");
  await expect(sections).toHaveCount(5);

  const heights = await sections.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().height),
  );

  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
});

test("preview index separates CSS components from application patterns", async ({
  page,
}) => {
  await page.goto("./preview");

  await expect(
    page.getByRole("heading", { name: "Components", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SaaS patterns", level: 2 }),
  ).toBeVisible();

  const patterns = page.locator('section[aria-labelledby="preview-patterns"]');
  await expect(
    patterns.getByText("List/detail workspace", { exact: true }),
  ).toBeVisible();
  await expect(
    patterns.getByText("Settings console", { exact: true }),
  ).toBeVisible();
});

test("data table preview exposes a scoped bulk selection toolbar", async ({
  page,
}) => {
  await page.goto("./preview/data-table");

  const toolbar = page.getByRole("region", {
    name: "Selected account actions",
  });
  await expect(toolbar).toBeVisible();
  await expect(
    toolbar.getByText("1 account selected", { exact: true }),
  ).toBeVisible();
  await expect(
    toolbar.getByRole("button", { name: "Clear selection" }),
  ).toBeVisible();
  await expect(
    toolbar.getByRole("button", { name: "Assign owner" }),
  ).toBeVisible();
});

test("inline edit composition manages focus, cancel, and save", async ({
  page,
}) => {
  await page.goto("./preview/data-table");

  const editor = page.locator("[data-inline-edit]");
  const open = editor.getByRole("button", { name: "Edit", exact: true });
  const form = editor.locator("[data-inline-edit-form]");
  const input = form.getByLabel("Workspace name");

  await open.click();
  await expect(form).toBeVisible();
  await expect(input).toBeFocused();

  await input.fill("Temporary name");
  await form.getByRole("button", { name: "Cancel" }).click();
  await expect(form).toBeHidden();
  await expect(open).toBeFocused();

  await open.click();
  await expect(input).toHaveValue("Acme Operations");
  await input.fill("Northstar Operations");
  await form.getByRole("button", { name: "Save" }).click();

  await expect(form).toBeHidden();
  await expect(
    editor.getByText("Northstar Operations", { exact: true }),
  ).toBeVisible();
  await expect(editor.getByRole("status")).toHaveText("Workspace name saved.");
});

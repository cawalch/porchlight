import { expect, test } from "@playwright/test";

test("assignee combobox filters, commits, and submits by keyboard", async ({
  page,
}) => {
  await page.goto("./components/combobox");
  const form = page.getByRole("form", { name: "Assign a case" });
  const assignee = form.getByRole("combobox", { name: "Assignee" });
  const suggestions = form.getByRole("listbox");
  const options = suggestions.getByRole("option");
  const assigneeId = form.locator('input[type="hidden"][name="assignee_id"]');
  const submit = form.getByRole("button", { name: "Assign case" });
  const result = form.getByRole("status");

  async function expectActiveOption(name: string) {
    const option = suggestions.getByRole("option", { name, exact: true });
    await expect(option).toBeVisible();
    const id = await option.getAttribute("id");
    expect(id).toBeTruthy();
    await expect(assignee).toHaveAttribute("aria-activedescendant", id!);
    await expect(assignee).toBeFocused();
  }

  await expect(assignee).toHaveValue("");
  await expect(assigneeId).toHaveValue("");
  await assignee.pressSequentially("nia");
  await expect(assignee).toHaveAttribute("aria-expanded", "true");
  await expect(options).toHaveCount(2);
  await expect(
    suggestions.getByRole("option", { name: "Nia Gomez" }),
  ).toBeVisible();
  await expect(
    suggestions.getByRole("option", { name: "Nia Patel" }),
  ).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await expectActiveOption("Nia Gomez");
  await page.keyboard.press("ArrowDown");
  await expectActiveOption("Nia Patel");
  await page.keyboard.press("ArrowUp");
  await expectActiveOption("Nia Gomez");
  await expect(assigneeId).toHaveValue("");
  await page.keyboard.press("Enter");
  await expect(assignee).toHaveValue("Nia Gomez");
  await expect(assigneeId).toHaveValue("usr_124");
  await expect(result).not.toContainText("assignee_id=usr_124");
  await expect(assignee).toHaveAttribute("aria-expanded", "false");
  await expect(suggestions).toBeHidden();
  await expect(assignee).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(options).toHaveCount(3);
  await expectActiveOption("Nia Gomez");
  await page.keyboard.press("ArrowDown");
  await expectActiveOption("Nia Patel");
  await assignee.fill("lee");
  await expect(options).toHaveCount(1);
  await expect(
    suggestions.getByRole("option", { name: "Lee Chen" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(assignee).toHaveValue("Nia Gomez");
  await expect(assigneeId).toHaveValue("usr_124");
  await expect(assignee).toHaveAttribute("aria-expanded", "false");
  await expect(assignee).not.toHaveAttribute("aria-activedescendant");
  await expect(suggestions).toBeHidden();
  await expect(assignee).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(result).toHaveText("assignee_id=usr_124");
});

test("assignee lookup works after returning through docs navigation", async ({
  page,
}) => {
  await page.goto("./components/combobox/");
  const input = page.getByRole("combobox", { name: "Assignee", exact: true });
  await input.fill("Nia");
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "Field", exact: true }).first().click();
  await expect(page).toHaveURL(/\/components\/field\/?$/);
  await page.goBack();
  await input.fill("Lee");
  await expect(page.getByRole("option", { name: "Lee Chen" })).toBeVisible();
});

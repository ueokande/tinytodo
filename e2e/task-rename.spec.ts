import { expect, test } from "@playwright/test";

test("rename supports active and completed tasks, cancel, undo, and offline persistence", async ({
  page,
  context,
}) => {
  await page.goto("./");
  const add = page.getByLabel("New task title");
  await add.fill("Milk");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Rename Milk", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Task title", exact: true });
  await expect(input).toBeFocused();
  await input.fill("   ");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect(
    await input.evaluate((element: HTMLInputElement) => element.validity.valid),
  ).toBe(false);
  await input.fill("Oat milk");
  await input.press("Enter");
  await expect(
    page.getByRole("button", { name: "Rename Oat milk", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Rename Milk", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rename Milk", exact: true }).click();
  await input.fill("Unsaved");
  await input.press("Escape");
  await expect(
    page.getByRole("button", { name: "Rename Milk", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Rename Milk", exact: true }).click();
  await input.fill("Unsaved");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(input).toHaveCount(0);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Mark Milk as complete", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Rename Milk", exact: true }).click();
  await input.fill("Oat milk");
  await page.screenshot({
    path: "/tmp/tinytodo-rename.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator('#done [data-testid="todo-title"]')).toHaveText(
    "Oat milk",
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Rename Oat milk", exact: true })
    .click();
  await input.fill("Almond milk");
  await input.press("Enter");
  await page.reload();
  await expect(page.locator('#done [data-testid="todo-title"]')).toHaveText(
    "Almond milk",
  );
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveCount(
    0,
  );
});
test("a failed rename leaves the original task and editable draft intact", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("New task title").fill("Bread");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Rename Bread", exact: true }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  const input = page.getByRole("textbox", { name: "Task title", exact: true });
  await input.fill("Rye bread");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(input).toHaveValue("Rye bread");
  await expect(page.getByRole("alert")).toContainText("Unable to save");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Rename Bread", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText(
    "Bread",
  );
});

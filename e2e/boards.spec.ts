import { expect, type Page, test } from "@playwright/test";

const open = (page: Page) => page.locator("#board-switch").click();
async function addBoard(page: Page, name: string) {
  await open(page);
  await page.getByRole("button", { name: "+ Add board", exact: true }).click();
  await page.getByLabel("New board", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Create", exact: true }).click();
}
async function addTask(page: Page, title: string) {
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel("New task title").fill(title);
  await page.getByRole("button", { name: "Add task" }).click();
}
test("switch, rename, restore selection and delete boards without mixing tasks", async ({
  page,
}) => {
  await page.goto("./");
  await addTask(page, "Milk");
  await page.getByLabel("New task title").fill("Shopping draft");
  await addBoard(page, "Notes");
  await expect(page.locator("#board-name")).toHaveText("Notes");
  await expect(page.locator("#active [data-testid=todo-content]")).toHaveCount(
    0,
  );
  await expect(page.getByLabel("New task title")).toHaveValue("");
  await addTask(page, "Book appointment");
  await page
    .getByRole("button", { name: "Mark Book appointment as complete" })
    .click();
  await page.getByRole("button", { name: "Undo" }).click();
  await open(page);
  await page
    .getByRole("button", { name: "Switch to My list", exact: true })
    .click();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "Milk",
  );
  await expect(page.getByLabel("New task title")).toHaveValue("Shopping draft");
  await open(page);
  await page
    .getByRole("button", { name: "Options for Notes", exact: true })
    .click();
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByLabel("Rename board", { exact: true }).fill("Travel");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("#board-name")).toHaveText("My list");
  await open(page);
  await page
    .getByRole("button", { name: "Switch to Travel", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("#board-name")).toHaveText("Travel");
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "Book appointment",
  );
  await open(page);
  await page
    .getByRole("button", { name: "Options for Travel", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator("#board-delete-detail")).toContainText("1 task");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Options for Travel", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete board", exact: true }).click();
  await expect(page.locator("#board-name")).toHaveText("My list");
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "Milk",
  );
  await open(page);
  await page
    .getByRole("button", { name: "Options for My list", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toBeDisabled();
});
test("sheet closes with Escape and backdrop, rejects duplicate names, and works offline", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await open(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#board-switch")).toBeFocused();
  await open(page);
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toBeHidden();
  await open(page);
  await page.getByRole("button", { name: "+ Add board", exact: true }).click();
  await page.getByLabel("New board", { exact: true }).fill("My list");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .locator("#board-title")
      .evaluate((el: HTMLInputElement) => el.validity.valid),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await addBoard(page, "Offline");
  await addTask(page, "Batteries");
  await page.reload();
  await expect(page.locator("#board-name")).toHaveText("Offline");
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "Batteries",
  );
  await open(page);
  await page.screenshot({
    path: "/tmp/tinytodo-boards.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("failed storage write keeps the sheet open and shows an error", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await addBoard(page, "Save failure");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#board-error")).toBeVisible();
  await expect(page.locator("#board-name")).toHaveText("My list");
});

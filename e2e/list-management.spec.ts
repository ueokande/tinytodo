import { expect, type Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("tiny.boards.v2"))
      localStorage.setItem(
        "tiny.boards.v2",
        JSON.stringify({
          version: 2,
          selectedBoardId: "shopping",
          boards: [
            {
              id: "shopping",
              name: "Shopping",
              items: [
                { id: "milk", title: "Milk", done: false },
                { id: "bread", title: "Bread", done: false },
                { id: "coffee", title: "Coffee", done: true },
                { id: "tea", title: "Tea", done: true },
              ],
            },
            {
              id: "notes",
              name: "Notes",
              items: [{ id: "note", title: "Call the dentist", done: false }],
            },
            { id: "travel", name: "Travel", items: [] },
          ],
        }),
      );
  });
  await page.goto("./");
});
async function keyboardMove(
  page: Page,
  name: string,
  direction: "ArrowDown" | "ArrowUp",
) {
  const handle = page.getByRole("button", {
    name: `Reorder ${name}`,
    exact: true,
  });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.keyboard.press(direction);
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.keyboard.press("Space");
}
test("task editing reorders each group, disables swipe completion, and deletes with undo", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await keyboardMove(page, "Milk", "ArrowDown");
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await keyboardMove(page, "Coffee", "ArrowDown");
  await expect(page.locator('#done [data-testid="todo-title"]')).toHaveText([
    "Tea",
    "Coffee",
  ]);
  const row = await page
    .locator('[data-todo-id="milk"] [data-testid="todo-content"]')
    .boundingBox();
  if (!row) throw new Error("Row missing");
  await page.mouse.move(row.x + 110, row.y + 30);
  await page.mouse.down();
  await page.mouse.move(row.x + 230, row.y + 30, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await page.getByRole("button", { name: "Delete Bread", exact: true }).click();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Milk",
  ]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await page
    .getByRole("button", { name: "Delete Coffee", exact: true })
    .click();
  await expect(page.locator('#done [data-testid="todo-title"]')).toHaveText([
    "Tea",
  ]);
  await page.reload();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await expect(page.locator('#done [data-testid="todo-title"]')).toHaveText([
    "Tea",
  ]);
  await expect(
    page.getByRole("button", { name: "Reorder Milk", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.screenshot({
    path: "/tmp/tinytodo-task-edit.png",
    animations: "disabled",
  });
});
test("boards reorder persistently and archive/restore preserve tasks and protect the last active board", async ({
  page,
  context,
}) => {
  await page.locator("#board-switch").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Edit", exact: true }).click();
  await keyboardMove(page, "Shopping", "ArrowDown");
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.locator('#board-list button[aria-label^="Switch to"]'),
  ).toHaveText(["Notes", "Shopping", "Travel"]);
  await page.screenshot({
    path: "/tmp/tinytodo-board-order.png",
    animations: "disabled",
  });
  await dialog
    .getByRole("button", { name: "Options for Shopping", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#board-name")).toHaveText("Notes");
  await page.reload();
  await page.locator("#board-switch").click();
  await expect(
    page.getByRole("button", { name: "Switch to Shopping", exact: true }),
  ).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Options for Travel", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.locator("#board-switch").click();
  await dialog
    .getByRole("button", { name: "Options for Notes", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Archive", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Delete", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Back", exact: true }).click();
  await dialog.getByRole("button", { name: "Archived", exact: true }).click();
  await page.screenshot({
    path: "/tmp/tinytodo-archived.png",
    animations: "disabled",
  });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await dialog
    .getByRole("button", { name: "Restore Shopping", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Switch to Shopping", exact: true })
    .click();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Milk",
    "Bread",
  ]);
  await expect(page.locator('#done [data-testid="todo-title"]')).toHaveText([
    "Coffee",
    "Tea",
  ]);
  await page.reload();
  await expect(page.locator("#board-name")).toHaveText("Shopping");
});
test("pointer drag reorders tasks and failed saves keep the original order and archive status", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const source = await page
      .getByRole("button", { name: "Reorder Milk", exact: true })
      .boundingBox(),
    target = await page
      .getByRole("button", { name: "Reorder Bread", exact: true })
      .boundingBox();
  if (!source || !target) throw new Error("Handles missing");
  await page.mouse.move(source.x + 20, source.y + 20);
  await page.mouse.down();
  await page.mouse.move(source.x + 20, source.y + 32, { steps: 3 });
  await page.mouse.move(target.x + 20, target.y + 30, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await keyboardMove(page, "Bread", "ArrowDown");
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await page.getByRole("button", { name: "Delete Milk", exact: true }).click();
  await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText([
    "Bread",
    "Milk",
  ]);
  await page.locator("#board-switch").click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Options for Shopping", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator("#board-error")).toBeVisible();
  await expect(page.locator("#board-name")).toHaveText("Shopping");
});

test.describe("touch interactions", () => {
  test.use({ hasTouch: true });
  test("touch drag reorders boards and cancellation leaves task order unchanged", async ({
    page,
    context,
  }) => {
    await page.getByRole("button", { name: "Edit", exact: true }).tap();
    const task = page.getByRole("button", {
      name: "Reorder Milk",
      exact: true,
    });
    await task.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(page.locator('#active [data-testid="todo-title"]')).toHaveText(
      ["Milk", "Bread"],
    );
    await page.getByRole("button", { name: "Done", exact: true }).tap();
    await page.locator("#board-switch").tap();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Edit", exact: true }).tap();
    const from = await page
        .getByRole("button", { name: "Reorder Shopping", exact: true })
        .boundingBox(),
      to = await page
        .getByRole("button", { name: "Reorder Notes", exact: true })
        .boundingBox();
    if (!from || !to) throw new Error("Handles missing");
    const cdp = await context.newCDPSession(page);
    const x = from.x + 20,
      y = from.y + 22,
      targetY = to.y + 26;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 12; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + ((targetY - y) * step) / 12 }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
    await dialog.evaluate(async (element) => {
      await new Promise(requestAnimationFrame);
      await Promise.allSettled(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await page.screenshot({
      path: "/tmp/tinytodo-board-edit.png",
      animations: "disabled",
    });
    await dialog.getByRole("button", { name: "Done", exact: true }).tap();
    await expect(
      page.locator('#board-list button[aria-label^="Switch to"]'),
    ).toHaveText(["Notes", "Shopping", "Travel"]);
    await dialog.getByRole("button", { name: "Close", exact: true }).tap();
    await expect(dialog).toBeHidden();
    await page.reload();
    await page.locator("#board-switch").tap();
    await expect(
      page.locator('#board-list button[aria-label^="Switch to"]'),
    ).toHaveText(["Notes", "Shopping", "Travel"]);
  });
});

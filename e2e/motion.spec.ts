import { expect, test } from "@playwright/test";

test("sheet animates both ways, restores focus, and can reopen after interrupted entry", async ({
  page,
}) => {
  await page.goto("./");
  const started = await page.evaluate(async () => {
    document.getElementById("board-switch")?.click();
    await new Promise(requestAnimationFrame);
    const dialog = document.querySelector("dialog");
    return { open: dialog?.open, animations: dialog?.getAnimations().length };
  });
  expect(started.open).toBe(true);
  expect(started.animations).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#board-switch")).toBeFocused();
  await page.locator("#board-switch").click();
  const exiting = await page.evaluate(() => {
    document.getElementById("board-close")?.click();
    return Boolean(document.querySelector("dialog")?.open);
  });
  expect(exiting).toBe(true);
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.locator("#board-switch").click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("drag handle snaps back for a short pull and dismisses for a long pull", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("#board-switch").click();
  await page.locator("#board-close").hover();
  // Wait on actual animations rather than a fixed delay before measuring geometry.
  await page.locator("#board-picker").evaluate(async (el) => {
    await Promise.allSettled(
      el.getAnimations().map((animation) => animation.finished),
    );
  });
  const handle = await page.locator("[data-sheet-drag=handle]").boundingBox();
  if (!handle) throw new Error("Handle not visible");
  const x = handle.x + handle.width / 2,
    y = handle.y + handle.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 10, { steps: 3 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator("#board-picker").evaluate(async (el) => {
    await Promise.allSettled(
      el.getAnimations().map((animation) => animation.finished),
    );
  });
  await expect(page.locator("#board-picker")).toHaveCSS("transform", "none");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 110, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("reduced motion skips movement and modal exit remains immediately usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  expect(
    await page.evaluate(async () => {
      document.getElementById("board-switch")?.click();
      await new Promise(requestAnimationFrame);
      return document.querySelector("dialog")?.getAnimations({ subtree: true })
        .length;
    }),
  ).toBe(0);
  expect(
    await page.evaluate(() => {
      document.getElementById("board-close")?.click();
      return Boolean(document.querySelector("dialog")?.open);
    }),
  ).toBe(false);
  await page.getByLabel("New task title").fill("Milk");
  await page.getByRole("button", { name: "Add task" }).click();
  expect(
    await page
      .locator("#task-list")
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.getByRole("button", { name: "Mark Milk as complete" }).click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "Milk",
  );
});

test("rapid completion and undo persist without leaving animation overlays", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("New task title").fill("Bread");
  await page.getByRole("button", { name: "Add task" }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Mark Bread as complete" }).click();
    await page.getByRole("button", { name: "Undo" }).click();
  }
  await page.reload();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "Bread",
  );
  await page.getByRole("button", { name: "Mark Bread as complete" }).click();
  await page.getByRole("button", { name: "Clear completed" }).click();
  await expect(page.locator("[data-testid=todo-ghost]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#done [data-testid=todo-title]")).toHaveText(
    "Bread",
  );
});

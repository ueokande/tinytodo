import { expect, test } from "@playwright/test";

test("add, swipe, undo, reload, clear and offline restart", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.getByLabel("新しい項目のタイトル").fill("牛乳");
  await page.getByRole("button", { name: "項目を追加" }).click();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  await page.reload();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  const row = page.locator("#active [data-testid=todo-content]");
  const box = await row.boundingBox();
  if (!box) throw new Error("Todo row is not visible");
  await page.mouse.move(box.x + 100, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 205, box.y + 30, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator("#done [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  await page.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  await page.getByRole("button", { name: "牛乳を完了にする" }).click();
  await page.getByRole("button", { name: "まとめて削除" }).click();
  await expect(page.locator("#completed")).toBeHidden();
  await page.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.locator("#done [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator("#done [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#done [data-testid=todo-title]")).toHaveText(
    "牛乳",
  );
  await page.getByLabel("新しい項目のタイトル").fill("パン");
  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.reload();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "パン",
  );
  await page.screenshot({
    path: "/tmp/tinytodo-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("title is rendered as text", async ({ page }) => {
  await page.goto("./");
  await page
    .getByLabel("新しい項目のタイトル")
    .fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "項目を追加" }).click();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator("#active img")).toHaveCount(0);
});

test("existing saved items survive the UI migration", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "tiny.todos.v1",
      JSON.stringify([{ id: "existing", title: "買い物メモ", done: false }]),
    );
  });
  await page.goto("./");
  await expect(page.locator("#board-name")).toBeVisible();
  await expect(page.locator("#active [data-testid=todo-title]")).toHaveText(
    "買い物メモ",
  );
  await expect(page.locator("footer, .intro")).toHaveCount(0);
});

test("bottom composer stays visible and leaves room for the last item and undo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("tiny.todos.v1")) {
      localStorage.setItem(
        "tiny.todos.v1",
        JSON.stringify(
          Array.from({ length: 25 }, (_, i) => ({
            id: String(i),
            title: `項目${i + 1}`,
            done: false,
          })),
        ),
      );
    }
  });
  await page.goto("./");
  const composer = page.locator("#composer");
  const before = await composer.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const after = await composer.boundingBox();
  expect(before).not.toBeNull();
  expect(after?.y).toBe(before?.y);
  const last = await page
    .locator("#active [data-testid=todo-content]")
    .last()
    .boundingBox();
  if (!last || !after) throw new Error("Missing layout bounds");
  expect(last.y + last.height).toBeLessThanOrEqual(after.y);
  await page.getByLabel("新しい項目のタイトル").fill("追加した項目");
  await page.getByLabel("新しい項目のタイトル").press("Enter");
  await expect(
    page.locator("#active [data-testid=todo-title]").last(),
  ).toHaveText("追加した項目");
  await expect(page.getByLabel("新しい項目のタイトル")).toBeFocused();
  await page
    .getByRole("button", { name: "項目1を完了にする", exact: true })
    .click();
  const toast = await page.locator("#toast").boundingBox();
  const bar = await composer.boundingBox();
  if (!toast || !bar) throw new Error("Missing notification bounds");
  expect(toast.y + toast.height).toBeLessThanOrEqual(bar.y);
});

test("composer follows simulated keyboard resize and viewport pan", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), {
      height: window.innerHeight,
      offsetTop: 0,
    });
    Object.defineProperty(window, "visualViewport", { value: viewport });
  });
  await page.goto("./");
  await page.getByLabel("新しい項目のタイトル").focus();
  await page.evaluate(() => {
    if (!window.visualViewport) throw new Error("Visual viewport missing");
    Object.assign(window.visualViewport, { height: window.innerHeight - 300 });
    window.visualViewport?.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator("#composer")).toHaveCSS("bottom", "300px");
  await page.evaluate(() => {
    if (!window.visualViewport) throw new Error("Visual viewport missing");
    Object.assign(window.visualViewport, { offsetTop: 50 });
    window.visualViewport?.dispatchEvent(new Event("scroll"));
  });
  await expect(page.locator("#composer")).toHaveCSS("bottom", "250px");
  await page.evaluate(() => {
    if (!window.visualViewport) throw new Error("Visual viewport missing");
    Object.assign(window.visualViewport, {
      height: window.innerHeight,
      offsetTop: 0,
    });
    window.visualViewport?.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator("#composer")).toHaveCSS("bottom", "0px");
});

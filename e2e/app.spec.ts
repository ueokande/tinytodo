import { expect, test } from "@playwright/test";

test("add, swipe, undo, reload, clear and offline restart", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByLabel("新しい項目のタイトル").fill("牛乳");
  await page.getByRole("button", { name: "項目を追加" }).click();
  await expect(page.locator("#active .item-title")).toHaveText("牛乳");
  await page.reload();
  await expect(page.locator("#active .item-title")).toHaveText("牛乳");
  const row = page.locator("#active .item");
  const box = await row.boundingBox();
  if (!box) throw new Error("Todo row is not visible");
  await page.mouse.move(box.x + 100, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 205, box.y + 30, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator("#done .item-title")).toHaveText("牛乳");
  await page.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.locator("#active .item-title")).toHaveText("牛乳");
  await page.getByRole("button", { name: "牛乳を完了にする" }).click();
  await page.getByRole("button", { name: "まとめて削除" }).click();
  await expect(page.locator("#completed")).toBeHidden();
  await page.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.locator("#done .item-title")).toHaveText("牛乳");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator("#done .item-title")).toHaveText("牛乳");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#done .item-title")).toHaveText("牛乳");
  await page.getByLabel("新しい項目のタイトル").fill("パン");
  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.reload();
  await expect(page.locator("#active .item-title")).toHaveText("パン");
  await page.screenshot({ path: "/tmp/tinytodo-mobile.png", fullPage: true });
});
test("title is rendered as text", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("新しい項目のタイトル")
    .fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "項目を追加" }).click();
  await expect(page.locator("#active .item-title")).toHaveText(
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
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "マイリスト 1" }),
  ).toBeVisible();
  await expect(page.locator("#active .item-title")).toHaveText("買い物メモ");
  await expect(page.locator("footer, .intro")).toHaveCount(0);
});

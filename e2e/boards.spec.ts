import { expect, type Page, test } from "@playwright/test";

const open = (page: Page) => page.locator("#board-switch").click();
async function addBoard(page: Page, name: string) {
  await open(page);
  await page
    .getByRole("button", { name: "＋ ボードを追加", exact: true })
    .click();
  await page.getByLabel("新しいボード", { exact: true }).fill(name);
  await page.getByRole("button", { name: "作成", exact: true }).click();
}
async function addTask(page: Page, title: string) {
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel("新しい項目のタイトル").fill(title);
  await page.getByRole("button", { name: "項目を追加" }).click();
}
test("switch, rename, restore selection and delete boards without mixing tasks", async ({
  page,
}) => {
  await page.goto("./");
  await addTask(page, "牛乳");
  await page.getByLabel("新しい項目のタイトル").fill("買い物の下書き");
  await addBoard(page, "メモ");
  await expect(page.locator("#board-name")).toHaveText("メモ");
  await expect(page.locator("#active .item")).toHaveCount(0);
  await expect(page.getByLabel("新しい項目のタイトル")).toHaveValue("");
  await addTask(page, "予約する");
  await page.getByRole("button", { name: "予約するを完了にする" }).click();
  await page.getByRole("button", { name: "元に戻す" }).click();
  await open(page);
  await page
    .getByRole("button", { name: "マイリストに切り替え", exact: true })
    .click();
  await expect(page.locator("#active .item-title")).toHaveText("牛乳");
  await expect(page.getByLabel("新しい項目のタイトル")).toHaveValue(
    "買い物の下書き",
  );
  await open(page);
  await page.getByRole("button", { name: "メモの操作", exact: true }).click();
  await page.getByRole("button", { name: "名前を変更", exact: true }).click();
  await page.getByLabel("ボード名を変更", { exact: true }).fill("旅行");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.locator("#board-name")).toHaveText("マイリスト");
  await open(page);
  await page
    .getByRole("button", { name: "旅行に切り替え", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("#board-name")).toHaveText("旅行");
  await expect(page.locator("#active .item-title")).toHaveText("予約する");
  await open(page);
  await page.getByRole("button", { name: "旅行の操作", exact: true }).click();
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await expect(page.locator("#board-delete-detail")).toContainText("1件");
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await page.getByRole("button", { name: "旅行の操作", exact: true }).click();
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page.locator("#board-name")).toHaveText("マイリスト");
  await expect(page.locator("#active .item-title")).toHaveText("牛乳");
  await open(page);
  await page
    .getByRole("button", { name: "マイリストの操作", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "削除", exact: true }),
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
  await page
    .getByRole("button", { name: "＋ ボードを追加", exact: true })
    .click();
  await page.getByLabel("新しいボード", { exact: true }).fill("マイリスト");
  await page.getByRole("button", { name: "作成", exact: true }).click();
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
  await addBoard(page, "オフライン");
  await addTask(page, "電池");
  await page.reload();
  await expect(page.locator("#board-name")).toHaveText("オフライン");
  await expect(page.locator("#active .item-title")).toHaveText("電池");
  await open(page);
  await page.screenshot({ path: "/tmp/tinytodo-boards.png", fullPage: true });
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
  await addBoard(page, "保存失敗");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#board-error")).toBeVisible();
  await expect(page.locator("#board-name")).toHaveText("マイリスト");
});

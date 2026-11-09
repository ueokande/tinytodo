import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addBoard,
  deleteBoard,
  initialState,
  renameBoard,
  selectedBoard,
  updateBoardItems,
} from "../src/domain/board.ts";
import {
  BOARD_KEY,
  readBoards,
  writeBoards,
} from "../src/storage/board-storage.ts";
import { KEY } from "../src/storage/todo-storage.ts";

function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
test("migrate legacy titles and completion without changing the original data", () => {
  const storage = memory();
  const old = JSON.stringify([{ id: "milk", title: "牛乳", done: true }]);
  storage.setItem(KEY, old);
  const state = readBoards(storage);
  assert.equal(selectedBoard(state).name, "マイリスト");
  assert.equal(selectedBoard(state).items[0].done, true);
  writeBoards(storage, state);
  assert.deepEqual(readBoards(storage), state);
  assert.equal(storage.getItem(KEY), old);
});
test("boards are independent, names validated, selection retained, and last board protected", () => {
  const original = initialState([{ id: "milk", title: "牛乳", done: false }]);
  const next = addBoard(original, " メモ ");
  assert.equal(selectedBoard(next).name, "メモ");
  assert.equal(selectedBoard(next).items.length, 0);
  assert.equal(next.boards[0].items.length, 1);
  assert.throws(() => addBoard(next, "メモ"));
  assert.throws(() => addBoard(next, " "));
  assert.throws(() => renameBoard(next, next.selectedBoardId, "a".repeat(41)));
  const renamed = renameBoard(next, next.selectedBoardId, "旅行");
  const storage = memory();
  writeBoards(storage, renamed);
  assert.equal(selectedBoard(readBoards(storage)).name, "旅行");
  const removed = deleteBoard(renamed, renamed.selectedBoardId);
  assert.equal(selectedBoard(removed).id, original.selectedBoardId);
  assert.throws(() => deleteBoard(removed, removed.selectedBoardId));
});
test("corrupt versioned data must not silently fall back to legacy data", () => {
  const storage = memory();
  storage.setItem(KEY, "[]");
  for (const raw of [
    "{",
    "null",
    JSON.stringify({ version: 2, boards: [], selectedBoardId: "missing" }),
    JSON.stringify({ ...initialState(), selectedBoardId: "missing" }),
  ]) {
    storage.setItem(BOARD_KEY, raw);
    assert.throws(() => readBoards(storage));
  }
});
test("a failed save preserves the last persisted boards", () => {
  const storage = memory();
  const state = initialState();
  writeBoards(storage, state);
  assert.throws(() =>
    writeBoards(
      {
        setItem: () => {
          throw new Error("quota");
        },
      },
      addBoard(state, "メモ"),
    ),
  );
  assert.deepEqual(readBoards(storage), state);
});

test("updating one board preserves the other boards and selection", () => {
  const first = initialState();
  const state = addBoard(first, "メモ");
  const items = [{ id: "milk", title: "牛乳", done: false }];
  const next = updateBoardItems(state, first.selectedBoardId, items);
  assert.deepEqual(next.boards[0].items, items);
  assert.strictEqual(next.boards[1], state.boards[1]);
  assert.equal(next.selectedBoardId, state.selectedBoardId);
  assert.deepEqual(state.boards[0].items, []);
  assert.throws(() => updateBoardItems(state, "missing", items));
});

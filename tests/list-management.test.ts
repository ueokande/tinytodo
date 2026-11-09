import { assert, test } from "vitest";
import {
  activeBoards,
  addBoard,
  archiveBoard,
  deleteBoard,
  initialState,
  reorderBoards,
  restoreBoard,
  selectBoard,
} from "../src/domain/board.ts";
import { reorderTasks } from "../src/domain/todo.ts";
import {
  BOARD_KEY,
  readBoards,
  writeBoards,
} from "../src/storage/board-storage.ts";

test("tasks reorder within completion groups without mutating or losing items", () => {
  const items = [
    { id: "a", title: "Milk", done: false },
    { id: "c", title: "Coffee", done: true },
    { id: "b", title: "Bread", done: false },
    { id: "d", title: "Tea", done: true },
  ];
  const next = reorderTasks(items, "a", "b");
  assert.deepEqual(
    next.map((item) => item.id),
    ["b", "c", "a", "d"],
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ["a", "c", "b", "d"],
  );
  assert.deepEqual(
    reorderTasks(next, "c", "d").map((item) => item.id),
    ["b", "d", "a", "c"],
  );
  assert.deepEqual(reorderTasks(items, "a", "c"), items);
  assert.deepEqual(reorderTasks(items, "missing", "b"), items);
});
test("archive preserves tasks, selects an active fallback, and protects the last active board", () => {
  const original = initialState([{ id: "milk", title: "Milk", done: true }]);
  const withNotes = addBoard(original, "Notes");
  const next = archiveBoard(
    selectBoard(withNotes, original.selectedBoardId),
    original.selectedBoardId,
  );
  assert.equal(next.selectedBoardId, withNotes.selectedBoardId);
  assert.equal(next.boards[0].archived, true);
  assert.deepEqual(next.boards[0].items, original.boards[0].items);
  assert.throws(() => archiveBoard(next, next.selectedBoardId));
  assert.throws(() => deleteBoard(next, next.selectedBoardId));
  assert.throws(() => selectBoard(next, original.selectedBoardId));
  const restored = restoreBoard(next, original.selectedBoardId);
  assert.equal(restored.selectedBoardId, next.selectedBoardId);
  assert.deepEqual(
    activeBoards(restored.boards).map((board) => board.name),
    ["Notes", "My list"],
  );
  assert.deepEqual(restored.boards[1].items, original.boards[0].items);
  assert.equal(original.boards[0].archived, undefined);
});
test("board order and archive flags survive storage; legacy boards remain active", () => {
  let state = addBoard(addBoard(initialState(), "Notes"), "Travel");
  const [first, notes, travel] = state.boards;
  state = archiveBoard(state, notes.id);
  state = reorderBoards(state, travel.id, first.id);
  assert.deepEqual(
    activeBoards(state.boards).map((board) => board.name),
    ["Travel", "My list"],
  );
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  writeBoards(storage, state);
  assert.deepEqual(readBoards(storage), state);
  storage.setItem(BOARD_KEY, JSON.stringify(initialState()));
  assert.equal(activeBoards(readBoards(storage).boards).length, 1);
  storage.setItem(
    BOARD_KEY,
    JSON.stringify({ ...state, selectedBoardId: notes.id }),
  );
  assert.throws(() => readBoards(storage));
  storage.setItem(
    BOARD_KEY,
    JSON.stringify({
      ...state,
      boards: state.boards.map((board) => ({ ...board, archived: "yes" })),
    }),
  );
  assert.throws(() => readBoards(storage));
});

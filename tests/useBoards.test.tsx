// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { afterEach, expect, test } from "vitest";
import {
  addBoard,
  selectedBoard,
  updateBoardItems,
} from "../src/domain/board.ts";
import { useBoards } from "../src/hooks/useBoards.ts";
import { BOARD_KEY } from "../src/storage/board-storage.ts";
import { KEY } from "../src/storage/todo-storage.ts";

afterEach(cleanup);
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const wrapper = ({ children }: { children: ReactNode }) => (
  <StrictMode>{children}</StrictMode>
);
test("React state migrates old data and accumulates batched updates in StrictMode", () => {
  const storage = memory();
  storage.setItem(
    KEY,
    JSON.stringify([{ id: "milk", title: "Milk", done: false }]),
  );
  const { result } = renderHook(() => useBoards(storage), { wrapper });
  expect(selectedBoard(result.current.state).items[0].title).toBe("Milk");
  act(() => {
    result.current.save((previous) => addBoard(previous, "Notes"));
    result.current.save((previous) =>
      updateBoardItems(previous, previous.selectedBoardId, [
        { id: "note", title: "Appointment", done: false },
      ]),
    );
  });
  expect(result.current.state.boards).toHaveLength(2);
  expect(selectedBoard(result.current.state).name).toBe("Notes");
  expect(selectedBoard(result.current.state).items[0].title).toBe(
    "Appointment",
  );
  expect(JSON.parse(storage.getItem(BOARD_KEY) ?? "null")).toEqual(
    result.current.state,
  );
});
test("failed writes preserve rendered state and corrupt data cannot be overwritten", () => {
  const storage = memory();
  const { result } = renderHook(() => useBoards(storage), { wrapper });
  const previous = result.current.state;
  storage.setItem = () => {
    throw new Error("quota");
  };
  act(() => {
    expect(result.current.save((state) => addBoard(state, "Notes"))).toBe(
      false,
    );
  });
  expect(result.current.state).toBe(previous);
  expect(result.current.error).toContain("Unable to save");
  const corrupt = memory();
  corrupt.setItem(BOARD_KEY, "broken");
  const { result: blocked } = renderHook(() => useBoards(corrupt), { wrapper });
  act(() => {
    expect(blocked.current.save((state) => addBoard(state, "New board"))).toBe(
      false,
    );
  });
  expect(corrupt.getItem(BOARD_KEY)).toBe("broken");
});

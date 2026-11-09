// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { useTodoApp } from "../src/hooks/useTodoApp.ts";

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
test("application commands isolate board tasks, drafts, and undo", () => {
  const storage = memory();
  const { result } = renderHook(() => useTodoApp(storage));
  const first = result.current.board.id;
  act(() => result.current.setDraft("Milk"));
  act(() => {
    expect(result.current.addTask()).toBe(true);
  });
  act(() => result.current.createBoard("Notes"));
  const notes = result.current.board.id;
  act(() => result.current.setDraft("Call the dentist"));
  act(() => result.current.selectBoard(first));
  expect(result.current.board.items.map((item) => item.title)).toEqual([
    "Milk",
  ]);
  expect(result.current.draft).toBe("");
  act(() => result.current.selectBoard(notes));
  expect(result.current.draft).toBe("Call the dentist");
  act(() => result.current.addTask());
  const task = result.current.board.items[0];
  act(() => result.current.toggleTask(task.id));
  expect(result.current.board.items[0].done).toBe(true);
  const undo = result.current.notice?.undo;
  expect(undo).toBeTypeOf("function");
  act(() => {
    result.current.dismissNotice();
    undo?.();
  });
  expect(result.current.board.items[0].done).toBe(false);
  act(() => result.current.selectBoard(first));
  expect(result.current.notice).toBeNull();
  expect(result.current.board.items[0].title).toBe("Milk");
});
test("failed task persistence preserves the draft and visible list", () => {
  const storage = memory();
  const { result } = renderHook(() => useTodoApp(storage));
  act(() => result.current.setDraft("Bread"));
  storage.setItem = () => {
    throw new Error("quota");
  };
  act(() => {
    expect(result.current.addTask()).toBe(false);
  });
  expect(result.current.draft).toBe("Bread");
  expect(result.current.board.items).toEqual([]);
  expect(result.current.notice?.message).toContain("Unable to save");
});

import { useEffect, useState } from "react";
import {
  addBoard,
  archiveBoard,
  type BoardState,
  deleteBoard,
  renameBoard,
  reorderBoards,
  restoreBoard,
  selectBoard,
  selectedBoard,
  updateBoardItems,
} from "../domain/board.ts";
import { createItem, reorderTasks, type Todo, toggle } from "../domain/todo.ts";
import type { TodoStorage } from "../storage/todo-storage.ts";
import { useBoards } from "./useBoards.ts";
import { useOfflineSupport } from "./useOfflineSupport.ts";
import { useToast } from "./useToast.ts";

/** Application commands coordinate persistence and undo; components receive intentions. */
export function useTodoApp(storage?: TodoStorage) {
  const { state, save, error, getState } = useBoards(storage);
  const { notice, notify, dismiss } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const board = selectedBoard(state);
  useOfflineSupport(notify);
  useEffect(() => {
    if (error) notify(error);
  }, [error, notify]);
  function commitTasks(
    transform: (items: Todo[]) => Todo[],
    message?: string,
  ): boolean {
    const previous = selectedBoard(getState());
    if (
      !save((current) =>
        updateBoardItems(current, previous.id, transform(previous.items)),
      )
    )
      return false;
    if (message)
      notify(message, () => {
        save((current) =>
          updateBoardItems(current, previous.id, previous.items),
        );
      });
    else dismiss();
    return true;
  }
  function changeBoards(transform: (state: BoardState) => BoardState): boolean {
    if (!save(transform)) return false;
    dismiss();
    return true;
  }
  return {
    board,
    boards: state.boards,
    selectedBoardId: state.selectedBoardId,
    remainingCount: board.items.filter((item) => !item.done).length,
    draft: drafts[board.id] ?? "",
    notice,
    dismissNotice: dismiss,
    setDraft(value: string) {
      setDrafts((previous) => ({ ...previous, [board.id]: value }));
    },
    addTask() {
      const item = createItem(drafts[board.id] ?? "");
      if (!item || !commitTasks((items) => [...items, item])) return false;
      setDrafts((previous) => ({ ...previous, [board.id]: "" }));
      return true;
    },
    toggleTask(id: string) {
      const item = selectedBoard(getState()).items.find(
        (item) => item.id === id,
      );
      if (item)
        commitTasks(
          (items) => toggle(items, id),
          item.done ? "Task restored" : "Task completed",
        );
    },
    clearCompleted() {
      commitTasks(
        (items) => items.filter((item) => !item.done),
        "Completed tasks cleared",
      );
    },
    deleteTask(id: string) {
      return commitTasks(
        (items) => items.filter((item) => item.id !== id),
        "Task deleted",
      );
    },
    reorderTasks(id: string, targetId: string) {
      return commitTasks((items) => reorderTasks(items, id, targetId));
    },
    reorderBoards(id: string, targetId: string) {
      return changeBoards((current) => reorderBoards(current, id, targetId));
    },
    archiveBoard(id: string) {
      return changeBoards((current) => archiveBoard(current, id));
    },
    restoreBoard(id: string) {
      return changeBoards((current) => restoreBoard(current, id));
    },
    selectBoard(id: string) {
      return changeBoards((current) => selectBoard(current, id));
    },
    createBoard(name: string) {
      return changeBoards((current) => addBoard(current, name));
    },
    renameBoard(id: string, name: string) {
      return changeBoards((current) => renameBoard(current, id, name));
    },
    deleteBoard(id: string) {
      return changeBoards((current) => deleteBoard(current, id));
    },
  };
}

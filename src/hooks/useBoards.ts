import { useCallback, useEffect, useRef, useState } from "react";
import { type BoardState, initialState } from "../domain/board.ts";
import { readBoards, writeBoards } from "../storage/board-storage.ts";
import type { TodoStorage } from "../storage/todo-storage.ts";

function load(storage?: TodoStorage) {
  try {
    const source = storage ?? window.localStorage;
    return { state: readBoards(source), storage: source, error: null };
  } catch {
    return {
      state: initialState(),
      storage: null,
      error:
        "保存データを読み込めませんでした。ブラウザの設定をご確認ください。",
    };
  }
}
/** React owns the state; persist before publishing updates, including batched events. */
export function useBoards(storage?: TodoStorage) {
  const [loaded] = useState(() => load(storage));
  const [state, setState] = useState(loaded.state);
  const [error, setError] = useState<string | null>(loaded.error);
  const current = useRef(state);
  const save = useCallback(
    (next: BoardState | ((previous: BoardState) => BoardState)): boolean => {
      if (!loaded.storage) {
        setError("保存データを読み込めないため、変更できません。");
        return false;
      }
      const value = typeof next === "function" ? next(current.current) : next;
      try {
        writeBoards(loaded.storage, value);
      } catch {
        setError(
          "保存できません。ブラウザの保存設定や空き容量をご確認ください。",
        );
        return false;
      }
      current.current = value;
      setState(value);
      setError(null);
      return true;
    },
    [loaded],
  );
  // Migration is a side effect, never performed during render or an updater function.
  useEffect(() => {
    if (loaded.storage) save((previous) => previous);
  }, [loaded, save]);
  const getState = useCallback(() => current.current, []);
  return { state, save, error, getState };
}

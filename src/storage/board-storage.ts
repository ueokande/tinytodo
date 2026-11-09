import { type Board, type BoardState, initialState } from "../domain/board.ts";
import { isTodo, read, type TodoStorage } from "./todo-storage.ts";
export const BOARD_KEY = "tiny.boards.v2";
function isBoard(value: unknown): value is Board {
  if (!value || typeof value !== "object") return false;
  const board = value as Record<string, unknown>;
  return (
    typeof board.id === "string" &&
    typeof board.name === "string" &&
    board.name.trim().length > 0 &&
    Array.isArray(board.items) &&
    board.items.every(isTodo)
  );
}
export function readBoards(storage: Pick<TodoStorage, "getItem">): BoardState {
  const raw = storage.getItem(BOARD_KEY);
  if (raw === null) return initialState(read(storage));
  const state = JSON.parse(raw) as Partial<BoardState> | null;
  if (
    !state ||
    state.version !== 2 ||
    !Array.isArray(state.boards) ||
    !state.boards.length ||
    !state.boards.every(isBoard) ||
    new Set(state.boards.map((board) => board.id)).size !==
      state.boards.length ||
    !state.boards.some((board) => board.id === state.selectedBoardId)
  )
    throw new Error("Invalid saved boards");
  return state as BoardState;
}
export function writeBoards(
  storage: Pick<TodoStorage, "setItem">,
  state: BoardState,
): void {
  storage.setItem(BOARD_KEY, JSON.stringify(state));
}

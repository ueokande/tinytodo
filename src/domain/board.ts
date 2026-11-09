import type { Todo } from "./todo.ts";
export interface Board {
  id: string;
  name: string;
  items: Todo[];
}
export interface BoardState {
  version: 2;
  boards: Board[];
  selectedBoardId: string;
}
export const MAX_BOARD_NAME_LENGTH = 40;
export function initialState(items: Todo[] = []): BoardState {
  const board = { id: crypto.randomUUID(), name: "マイリスト", items };
  return { version: 2, boards: [board], selectedBoardId: board.id };
}
export function selectedBoard(state: BoardState): Board {
  const board = state.boards.find(
    (board) => board.id === state.selectedBoardId,
  );
  if (!board) throw new Error("Selected board is missing");
  return board;
}
export function validBoardName(
  state: BoardState,
  name: string,
  exceptId?: string,
): boolean {
  const clean = name.trim();
  return (
    clean.length > 0 &&
    clean.length <= MAX_BOARD_NAME_LENGTH &&
    !state.boards.some((board) => board.id !== exceptId && board.name === clean)
  );
}
export function addBoard(state: BoardState, name: string): BoardState {
  if (!validBoardName(state, name)) throw new Error("Invalid board name");
  const board = { id: crypto.randomUUID(), name: name.trim(), items: [] };
  return {
    ...state,
    boards: [...state.boards, board],
    selectedBoardId: board.id,
  };
}
export function renameBoard(
  state: BoardState,
  id: string,
  name: string,
): BoardState {
  if (
    !validBoardName(state, name, id) ||
    !state.boards.some((board) => board.id === id)
  )
    throw new Error("Invalid board name");
  return {
    ...state,
    boards: state.boards.map((board) =>
      board.id === id ? { ...board, name: name.trim() } : board,
    ),
  };
}
export function deleteBoard(state: BoardState, id: string): BoardState {
  if (state.boards.length <= 1) throw new Error("Cannot delete the last board");
  const boards = state.boards.filter((board) => board.id !== id);
  return {
    ...state,
    boards,
    selectedBoardId:
      state.selectedBoardId === id ? boards[0].id : state.selectedBoardId,
  };
}

import { reorder } from "./reorder.ts";
import type { Todo } from "./todo.ts";
export interface Board {
  id: string;
  name: string;
  items: Todo[];
  archived?: boolean;
}
export interface BoardState {
  version: 2;
  boards: Board[];
  selectedBoardId: string;
}
export const MAX_BOARD_NAME_LENGTH = 40;
export function initialState(items: Todo[] = []): BoardState {
  const board = { id: crypto.randomUUID(), name: "My list", items };
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
  state: { boards: readonly Board[] },
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
  const target = state.boards.find((board) => board.id === id);
  if (!target) throw new Error("Board is missing");
  if (!target.archived && activeBoards(state.boards).length <= 1)
    throw new Error("Cannot delete the last active board");
  const boards = state.boards.filter((board) => board.id !== id);
  return {
    ...state,
    boards,
    selectedBoardId:
      state.selectedBoardId === id
        ? activeBoards(boards)[0].id
        : state.selectedBoardId,
  };
}

export function updateBoardItems(
  state: BoardState,
  id: string,
  items: Todo[],
): BoardState {
  if (!state.boards.some((board) => board.id === id))
    throw new Error("Board is missing");
  return {
    ...state,
    boards: state.boards.map((board) =>
      board.id === id ? { ...board, items } : board,
    ),
  };
}

export function activeBoards(boards: readonly Board[]): Board[] {
  return boards.filter((board) => !board.archived);
}
export function selectBoard(state: BoardState, id: string): BoardState {
  if (!activeBoards(state.boards).some((board) => board.id === id))
    throw new Error("Active board is missing");
  return { ...state, selectedBoardId: id };
}
export function archiveBoard(state: BoardState, id: string): BoardState {
  const active = activeBoards(state.boards);
  if (active.length <= 1)
    throw new Error("Cannot archive the last active board");
  if (!active.some((board) => board.id === id))
    throw new Error("Active board is missing");
  const boards = state.boards.map((board) =>
    board.id === id ? { ...board, archived: true } : board,
  );
  return {
    ...state,
    boards,
    selectedBoardId:
      state.selectedBoardId === id
        ? activeBoards(boards)[0].id
        : state.selectedBoardId,
  };
}
export function restoreBoard(state: BoardState, id: string): BoardState {
  const board = state.boards.find((board) => board.id === id && board.archived);
  if (!board) throw new Error("Archived board is missing");
  return {
    ...state,
    boards: [
      ...state.boards.filter((board) => board.id !== id),
      { ...board, archived: false },
    ],
  };
}
export function reorderBoards(
  state: BoardState,
  id: string,
  targetId: string,
): BoardState {
  const ordered = reorder(activeBoards(state.boards), id, targetId);
  let index = 0;
  return {
    ...state,
    boards: state.boards.map((board) =>
      board.archived ? board : ordered[index++],
    ),
  };
}

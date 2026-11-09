import {
  type BoardState,
  initialState,
  selectedBoard,
  updateBoardItems,
} from "./domain/board.ts";
import { createItem, type Todo, toggle } from "./domain/todo.ts";
import { readBoards, writeBoards } from "./storage/board-storage.ts";
import { createBoardPicker } from "./ui/board-picker.ts";
import { positionComposer } from "./ui/composer.ts";
import { element } from "./ui/dom.ts";
import layout from "./ui/layout.html?raw";
import { createToast } from "./ui/toast.ts";
import { createTodoList } from "./ui/todo-list.ts";

export function mountApp(root: HTMLElement) {
  root.innerHTML = layout;
  const title = element(root, "title", HTMLInputElement);
  const switchButton = element(root, "board-switch", HTMLButtonElement);
  const toast = createToast(
    element(root, "toast", HTMLElement),
    element(root, "message", HTMLElement),
    element(root, "undo", HTMLButtonElement),
  );
  const drafts = new Map<string, string>();
  let state = initialState();
  let storageAvailable = true;
  positionComposer(element(root, "composer", HTMLElement));
  try {
    state = readBoards(localStorage);
    writeBoards(localStorage, state);
  } catch {
    storageAvailable = false;
  }
  const view = createTodoList(root, (id) => {
    const board = selectedBoard(state);
    const item = board.items.find((item) => item.id === id);
    if (item)
      commit(
        toggle(board.items, id),
        item.done ? "未完了に戻しました" : "完了しました",
      );
  });

  // Persist first. Failed writes must not change the rendered state.
  function save(next: BoardState): boolean {
    if (!storageAvailable) {
      toast("保存データを読み込めないため、変更できません。");
      return false;
    }
    try {
      writeBoards(localStorage, next);
    } catch {
      toast("保存できません。ブラウザの保存設定や空き容量をご確認ください。");
      return false;
    }
    state = next;
    view.render(selectedBoard(state));
    return true;
  }
  function commit(items: Todo[], message?: string): boolean {
    const board = selectedBoard(state);
    if (!save(updateBoardItems(state, board.id, items))) return false;
    if (message)
      toast(message, () => {
        save(updateBoardItems(state, board.id, board.items));
      });
    else toast.dismiss();
    return true;
  }
  function changeBoard(next: BoardState): boolean {
    const currentId = state.selectedBoardId;
    drafts.set(currentId, title.value);
    if (!save(next)) return false;
    if (currentId !== next.selectedBoardId) {
      title.value = drafts.get(next.selectedBoardId) ?? "";
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    toast.dismiss();
    return true;
  }
  const picker = createBoardPicker(
    root,
    () => state,
    changeBoard,
    (id) => changeBoard({ ...state, selectedBoardId: id }),
  );
  switchButton.onclick = () => {
    title.blur();
    picker.open();
  };
  element(root, "add-form", HTMLFormElement).onsubmit = (event) => {
    event.preventDefault();
    const item = createItem(title.value);
    if (item && commit([...selectedBoard(state).items, item])) {
      title.value = "";
      title.focus({ preventScroll: true });
    }
  };
  element(root, "clear", HTMLButtonElement).onclick = () =>
    commit(
      selectedBoard(state).items.filter((item) => !item.done),
      "完了した項目を削除しました",
    );
  view.render(selectedBoard(state));
  if (!storageAvailable)
    toast("保存データを読み込めませんでした。ブラウザの設定をご確認ください。");
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() =>
        toast(
          "オフラインの準備ができませんでした。オンラインで再読み込みしてください。",
        ),
      );
  }
}

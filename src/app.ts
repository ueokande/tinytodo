import {
  type BoardState,
  initialState,
  selectedBoard,
} from "./domain/board.ts";
import { createItem, type Todo, toggle } from "./domain/todo.ts";
import { readBoards, writeBoards } from "./storage/board-storage.ts";
import { createBoardPicker } from "./ui/board-picker.ts";
import { positionComposer } from "./ui/composer.ts";
import layout from "./ui/layout.html?raw";
import { createToast } from "./ui/toast.ts";
import { createTodoRow } from "./ui/todo-row.ts";
export function mountApp(root: HTMLElement) {
  root.innerHTML = layout;
  let state = initialState();
  const drafts = new Map<string, string>();
  let folded = false;
  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing element: ${id}`);
    return element as T;
  };
  positionComposer($("composer"));
  let storageAvailable = true;
  try {
    state = readBoards(localStorage);
    writeBoards(localStorage, state);
  } catch {
    storageAvailable = false;
  }
  const toast = createToast(
    $("toast"),
    $("message"),
    $<HTMLButtonElement>("undo"),
  );
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
    render();
    return true;
  }
  function commit(items: Todo[], message?: string): boolean {
    const board = selectedBoard(state);
    const previous = board.items;
    const update = (next: Todo[]) =>
      save({
        ...state,
        boards: state.boards.map((value) =>
          value.id === board.id ? { ...value, items: next } : value,
        ),
      });
    if (!update(items)) return false;
    if (message)
      toast(message, () => {
        update(previous);
      });
    else toast.dismiss();
    return true;
  }
  function changeBoard(next: BoardState): boolean {
    const currentId = state.selectedBoardId;
    const title = $<HTMLInputElement>("title");
    drafts.set(currentId, title.value);
    if (!save(next)) return false;
    if (currentId !== next.selectedBoardId) {
      title.value = drafts.get(next.selectedBoardId) ?? "";
      folded = false;
      window.scrollTo({ top: 0, behavior: "instant" });
      render();
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
  $("board-switch").onclick = () => {
    $<HTMLInputElement>("title").blur();
    picker.open();
  };
  function render() {
    const board = selectedBoard(state);
    const items = board.items;
    $("board-name").textContent = board.name;
    const active = items.filter((x) => !x.done),
      done = items.filter((x) => x.done);
    $("count").textContent = String(active.length);
    $("done-count").textContent = String(done.length);
    $("active").replaceChildren(
      ...active.map((item) =>
        createTodoRow(item, () =>
          commit(toggle(selectedBoard(state).items, item.id), "完了しました"),
        ),
      ),
    );
    $("done").replaceChildren(
      ...done.map((item) =>
        createTodoRow(item, () =>
          commit(
            toggle(selectedBoard(state).items, item.id),
            "未完了に戻しました",
          ),
        ),
      ),
    );
    $("completed").hidden = !done.length;
    $("done").hidden = folded;
    $("fold").setAttribute("aria-expanded", String(!folded));
    $("chevron").textContent = folded ? "⌄" : "⌃";
  }
  $("add-form").onsubmit = (e) => {
    e.preventDefault();
    const item = createItem($<HTMLInputElement>("title").value);
    if (item && commit([...selectedBoard(state).items, item])) {
      $<HTMLInputElement>("title").value = "";
      $<HTMLInputElement>("title").focus({ preventScroll: true });
    }
  };
  $("fold").onclick = () => {
    folded = !folded;
    render();
  };
  $("clear").onclick = () =>
    commit(
      selectedBoard(state).items.filter((x) => !x.done),
      "完了した項目を削除しました",
    );
  render();
  if (!storageAvailable)
    toast("保存データを読み込めませんでした。ブラウザの設定をご確認ください。");
  if ("serviceWorker" in navigator && import.meta.env.PROD)
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() =>
        toast(
          "オフラインの準備ができませんでした。オンラインで再読み込みしてください。",
        ),
      );
}

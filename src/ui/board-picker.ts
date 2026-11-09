import {
  addBoard,
  type BoardState,
  deleteBoard,
  renameBoard,
  validBoardName,
} from "../domain/board.ts";
import { element } from "./dom.ts";
import { check } from "./icons.ts";
import { enter } from "./motion.ts";
import { createSheetMotion } from "./sheet-motion.ts";
export function createBoardPicker(
  root: HTMLElement,
  getState: () => BoardState,
  save: (state: BoardState) => boolean,
  select: (id: string) => boolean,
) {
  const get = (id: string) => element(root, id, HTMLElement);
  const dialog = element(root, "board-picker", HTMLDialogElement);
  const sheet = createSheetMotion(dialog);
  const input = element(root, "board-title", HTMLInputElement);
  dialog.addEventListener("close", () => {
    if (!dialog.open)
      element(root, "board-switch", HTMLButtonElement).focus({
        preventScroll: true,
      });
  });
  let targetId: string | null = null;
  let editing = false;
  const target = () => getState().boards.find((board) => board.id === targetId);
  function persist(next: BoardState): boolean {
    if (save(next)) return true;
    get("board-error").textContent =
      "保存できませんでした。保存設定や空き容量をご確認ください。";
    get("board-error").hidden = false;
    return false;
  }
  function show(id: string) {
    get("board-error").hidden = true;
    for (const panel of [
      "board-overview",
      "board-actions",
      "board-form",
      "board-confirm",
    ])
      get(panel).hidden = panel !== id;
    get("board-back").hidden = id === "board-overview";
    if (dialog.open) enter(get(id), id === "board-overview" ? -12 : 12, 0);
  }
  function overview() {
    const state = getState();
    get("board-list").replaceChildren(
      ...state.boards.map((board) => {
        const row = document.createElement("div");
        row.className = "board-row";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "board-select";
        const name = document.createElement("span");
        name.textContent = board.name;
        button.append(name);
        button.setAttribute("aria-label", `${board.name}に切り替え`);
        if (board.id === state.selectedBoardId) {
          const mark = document.createElement("span");
          mark.className = "board-check";
          mark.innerHTML = check;
          button.append(mark);
          button.setAttribute("aria-current", "true");
        }
        button.onclick = () => {
          if (select(board.id)) sheet.close();
          else {
            get("board-error").textContent =
              "ボードの選択を保存できませんでした。";
            get("board-error").hidden = false;
          }
        };
        const menu = document.createElement("button");
        menu.type = "button";
        menu.className = "board-menu";
        menu.textContent = "⋮";
        menu.setAttribute("aria-label", `${board.name}の操作`);
        menu.onclick = () => {
          targetId = board.id;
          get("board-action-name").textContent = board.name;
          const remove = element(root, "board-delete", HTMLButtonElement);
          remove.disabled = state.boards.length === 1;
          remove.title = remove.disabled ? "最後のボードは削除できません" : "";
          show("board-actions");
          get("board-rename").focus();
        };
        row.append(button, menu);
        return row;
      }),
    );
    show("board-overview");
  }
  function edit(rename: boolean) {
    editing = rename;
    get("board-form-label").textContent = rename
      ? "ボード名を変更"
      : "新しいボード";
    get("board-save").textContent = rename ? "保存" : "作成";
    input.value = rename ? (target()?.name ?? "") : "";
    input.setCustomValidity("");
    show("board-form");
    input.focus();
    input.select();
  }
  get("board-add").onclick = () => edit(false);
  get("board-rename").onclick = () => edit(true);
  get("board-back").onclick = () => {
    overview();
    get("board-add").focus();
  };
  get("board-close").onclick = () => sheet.close();
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      sheet.close();
  });
  input.oninput = () => input.setCustomValidity("");
  element(root, "board-form", HTMLFormElement).onsubmit = (event) => {
    event.preventDefault();
    const state = getState();
    if (
      !validBoardName(
        state,
        input.value,
        editing ? (targetId ?? undefined) : undefined,
      )
    ) {
      input.setCustomValidity(
        "1〜40文字の、重複しない名前を入力してください。",
      );
      input.reportValidity();
      return;
    }
    const next =
      editing && targetId
        ? renameBoard(state, targetId, input.value)
        : addBoard(state, input.value);
    if (persist(next)) sheet.close();
  };
  get("board-delete").onclick = () => {
    const board = target();
    if (!board) return;
    get("board-delete-title").textContent = `「${board.name}」を削除しますか？`;
    get("board-delete-detail").textContent =
      `${board.items.length}件の項目も削除されます。この操作は取り消せません。`;
    show("board-confirm");
    get("board-cancel").focus();
  };
  get("board-cancel").onclick = () => {
    overview();
    get("board-add").focus();
  };
  get("board-delete-confirm").onclick = () => {
    if (targetId && persist(deleteBoard(getState(), targetId))) sheet.close();
  };
  return {
    open() {
      overview();
      sheet.open();
      get("board-list")
        .querySelector<HTMLButtonElement>(".board-select[aria-current]")
        ?.focus();
    },
  };
}

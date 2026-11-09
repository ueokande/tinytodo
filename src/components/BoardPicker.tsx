import { type FormEvent, useLayoutEffect, useRef, useState } from "react";
import {
  addBoard,
  type BoardState,
  deleteBoard,
  renameBoard,
  validBoardName,
} from "../domain/board.ts";
import { enter } from "../ui/motion.ts";
import { createSheetMotion } from "../ui/sheet-motion.ts";
import styles from "./BoardPicker.module.css";
import { CheckIcon } from "./CheckIcon.tsx";

type Mode =
  | { type: "list" }
  | { type: "actions" | "rename" | "delete"; id: string }
  | { type: "add" };
interface Props {
  state: BoardState;
  onSave: (state: BoardState) => boolean;
  onClose: () => void;
}
export function BoardPicker({ state: currentState, onSave, onClose }: Props) {
  // Keep the outgoing panel intact while React updates the underlying board list.
  const [exitState, setExitState] = useState<BoardState | null>(null);
  const state = exitState ?? currentState;
  const [mode, setMode] = useState<Mode>({ type: "list" });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const sheet = useRef<ReturnType<typeof createSheetMotion> | null>(null);
  const board =
    "id" in mode
      ? state.boards.find((board) => board.id === mode.id)
      : undefined;
  useLayoutEffect(() => {
    if (!dialog.current) return;
    const controller = createSheetMotion(dialog.current, styles.closing);
    sheet.current = controller;
    controller.open();
    dialog.current
      .querySelector<HTMLButtonElement>('[aria-current="true"]')
      ?.focus();
    return () => {
      controller.dispose();
      sheet.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    setError(null);
    if (panel.current) enter(panel.current, mode.type === "list" ? -12 : 12, 0);
    if (mode.type === "add" || mode.type === "rename") {
      input.current?.focus();
      input.current?.select();
    } else if (mode.type === "delete")
      dialog.current
        ?.querySelector<HTMLButtonElement>("#board-cancel")
        ?.focus();
    else if (mode.type === "actions")
      dialog.current
        ?.querySelector<HTMLButtonElement>("#board-rename")
        ?.focus();
  }, [mode]);
  const save = (next: BoardState) => {
    if (onSave(next)) {
      setExitState(state);
      sheet.current?.close();
      return;
    }
    setError("保存できませんでした。保存設定や空き容量をご確認ください。");
  };
  const edit = (rename: boolean) => {
    setName(rename ? (board?.name ?? "") : "");
    setMode(
      rename && board ? { type: "rename", id: board.id } : { type: "add" },
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !validBoardName(state, name, mode.type === "rename" ? mode.id : undefined)
    ) {
      input.current?.setCustomValidity(
        "1〜40文字の、重複しない名前を入力してください。",
      );
      input.current?.reportValidity();
      return;
    }
    save(
      mode.type === "rename"
        ? renameBoard(state, mode.id, name)
        : addBoard(state, name),
    );
  };
  return (
    <dialog
      id="board-picker"
      ref={dialog}
      className={styles.sheet}
      aria-label="ボード"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          sheet.current?.close();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          sheet.current?.close();
      }}
    >
      <div
        className={styles.handle}
        data-sheet-drag="handle"
        aria-hidden="true"
      />
      <div className={styles.toolbar} data-sheet-drag="toolbar">
        <button
          type="button"
          id="board-back"
          className={styles.back}
          aria-label="戻る"
          hidden={mode.type === "list"}
          onClick={() => setMode({ type: "list" })}
        >
          ←
        </button>
        <button
          type="button"
          id="board-close"
          className={styles.close}
          aria-label="閉じる"
          onClick={() => sheet.current?.close()}
        >
          ×
        </button>
      </div>
      <p id="board-error" className={styles.error} role="alert" hidden={!error}>
        {error}
      </p>
      <div ref={panel}>
        {mode.type === "list" && (
          <div id="board-overview">
            <div id="board-list">
              {state.boards.map((value) => (
                <div key={value.id} className={styles.row}>
                  <button
                    type="button"
                    className={styles.select}
                    aria-label={`${value.name}に切り替え`}
                    aria-current={
                      value.id === state.selectedBoardId ? "true" : undefined
                    }
                    onClick={() =>
                      save({ ...state, selectedBoardId: value.id })
                    }
                  >
                    <span>{value.name}</span>
                    {value.id === state.selectedBoardId && (
                      <span className={styles.check}>
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles.menu}
                    aria-label={`${value.name}の操作`}
                    onClick={() => setMode({ type: "actions", id: value.id })}
                  >
                    ⋮
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              id="board-add"
              className={styles.add}
              onClick={() => edit(false)}
            >
              ＋ ボードを追加
            </button>
          </div>
        )}
        {mode.type === "actions" && board && (
          <section id="board-actions" className={styles.actions}>
            <h2>{board.name}</h2>
            <button type="button" id="board-rename" onClick={() => edit(true)}>
              名前を変更
            </button>
            <button
              type="button"
              id="board-delete"
              className={styles.danger}
              disabled={state.boards.length === 1}
              title={
                state.boards.length === 1
                  ? "最後のボードは削除できません"
                  : undefined
              }
              onClick={() => setMode({ type: "delete", id: board.id })}
            >
              削除
            </button>
          </section>
        )}
        {(mode.type === "add" || mode.type === "rename") && (
          <form id="board-form" className={styles.form} onSubmit={submit}>
            <label htmlFor="board-title">
              {mode.type === "rename" ? "ボード名を変更" : "新しいボード"}
            </label>
            <input
              id="board-title"
              ref={input}
              value={name}
              onChange={(event) => {
                event.currentTarget.setCustomValidity("");
                setName(event.target.value);
              }}
              maxLength={40}
              autoComplete="off"
              required
            />
            <button type="submit" id="board-save" className={styles.save}>
              {mode.type === "rename" ? "保存" : "作成"}
            </button>
          </form>
        )}
        {mode.type === "delete" && board && (
          <section id="board-confirm" className={styles.confirm}>
            <h2>「{board.name}」を削除しますか？</h2>
            <p id="board-delete-detail">
              {board.items.length}
              件の項目も削除されます。この操作は取り消せません。
            </p>
            <div className={styles.confirmButtons}>
              <button
                type="button"
                id="board-cancel"
                onClick={() => setMode({ type: "list" })}
              >
                キャンセル
              </button>
              <button
                type="button"
                id="board-delete-confirm"
                className={styles.danger}
                onClick={() => save(deleteBoard(state, board.id))}
              >
                削除する
              </button>
            </div>
          </section>
        )}
      </div>
    </dialog>
  );
}

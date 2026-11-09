import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import { BoardPicker } from "./components/BoardPicker.tsx";
import { TaskComposer } from "./components/TaskComposer.tsx";
import { Toast } from "./components/Toast.tsx";
import { TodoList } from "./components/TodoList.tsx";
import {
  type BoardState,
  selectedBoard,
  updateBoardItems,
} from "./domain/board.ts";
import { createItem, type Todo, toggle } from "./domain/todo.ts";
import { useBoards } from "./hooks/useBoards.ts";
import { useToast } from "./hooks/useToast.ts";
export function App() {
  const { state, save, error, getState } = useBoards();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const switchButton = useRef<HTMLButtonElement>(null);
  const board = selectedBoard(state);
  const draft = drafts[board.id] ?? "";
  const notify = toast.notify;
  useEffect(() => {
    if (error) notify(error);
  }, [error, notify]);
  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() =>
          notify(
            "Offline setup failed. Reload while connected to the internet.",
          ),
        );
  }, [notify]);
  const closePicker = useCallback(() => {
    setPickerOpen(false);
    switchButton.current?.focus({ preventScroll: true });
  }, []);
  function commit(
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
    else toast.dismiss();
    return true;
  }
  function changeBoard(next: BoardState): boolean {
    if (!save(next)) return false;
    if (state.selectedBoardId !== next.selectedBoardId)
      window.scrollTo({ top: 0, behavior: "instant" });
    toast.dismiss();
    return true;
  }
  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.heading}>
            <button
              ref={switchButton}
              type="button"
              id="board-switch"
              className={styles.boardSwitch}
              aria-haspopup="dialog"
              aria-controls="board-picker"
              onClick={() => {
                if (document.activeElement instanceof HTMLElement)
                  document.activeElement.blur();
                setPickerOpen(true);
              }}
            >
              <span id="board-name" className={styles.boardName}>
                {board.name}
              </span>
              <span aria-hidden="true">⌄</span>
            </button>
            <span id="count" className={styles.count}>
              {board.items.filter((item) => !item.done).length}
            </span>
          </h1>
        </header>
        <TodoList
          key={board.id}
          board={board}
          onToggle={(id) => {
            const item = selectedBoard(getState()).items.find(
              (item) => item.id === id,
            );
            if (item)
              commit(
                (items) => toggle(items, id),
                item.done ? "Task restored" : "Task completed",
              );
          }}
          onClear={() =>
            commit(
              (items) => items.filter((item) => !item.done),
              "Completed tasks cleared",
            )
          }
        />
      </main>
      <TaskComposer
        value={draft}
        onChange={(value) =>
          setDrafts((previous) => ({ ...previous, [board.id]: value }))
        }
        onAdd={() => {
          const item = createItem(draft);
          if (!item || !commit((items) => [...items, item])) return false;
          setDrafts((previous) => ({ ...previous, [board.id]: "" }));
          return true;
        }}
      />
      <Toast notice={toast.notice} onDismiss={toast.dismiss} />
      {pickerOpen && (
        <BoardPicker state={state} onSave={changeBoard} onClose={closePicker} />
      )}
    </>
  );
}

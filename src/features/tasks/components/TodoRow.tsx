import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { CheckIcon } from "../../../components/icons/CheckIcon.tsx";
import { TrashIcon } from "../../../components/icons/TrashIcon.tsx";
import type { Todo } from "../../../domain/todo.ts";
import { useSwipeCompletion } from "../hooks/useSwipeCompletion.ts";
import { TaskNameForm } from "./TaskNameForm.tsx";
import styles from "./TodoRow.module.css";

interface Props {
  item: Todo;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  handle?: ReactNode;
  onRename?: (id: string, title: string) => boolean;
}
export function TodoRow({ item, onToggle, onDelete, handle, onRename }: Props) {
  const [renaming, setRenaming] = useState(false);
  const titlePress = useRef<{ x: number; y: number } | null>(null);
  const titleButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (!renaming && restoreFocus.current) {
      titleButton.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [renaming]);
  const closeEditor = () => {
    restoreFocus.current = true;
    setRenaming(false);
  };
  const { contentRef, ready, ...handlers } = useSwipeCompletion(() =>
    onToggle(item.id),
  );
  return (
    <div
      className={`${styles.row} ${ready ? styles.ready : ""}`}
      data-todo-id={item.id}
      data-done={item.done}
    >
      <div className={styles.backdrop}>
        <CheckIcon />
      </div>
      {renaming && onRename ? (
        <TaskNameForm
          initialTitle={item.title}
          onCancel={closeEditor}
          onSave={(title) => {
            if (!onRename(item.id, title)) return false;
            closeEditor();
            return true;
          }}
        />
      ) : (
        <div
          ref={contentRef}
          className={`${styles.item} ${item.done ? styles.done : ""}`}
          data-testid="todo-content"
          {...(handle ? {} : handlers)}
        >
          {handle ?? (
            <button
              type="button"
              className={styles.check}
              onClick={() => onToggle(item.id)}
              aria-label={`Mark ${item.title} as ${item.done ? "incomplete" : "complete"}`}
            >
              {item.done && <CheckIcon />}
            </button>
          )}
          {handle && onRename ? (
            <button
              type="button"
              ref={titleButton}
              className={`${styles.title} ${styles.titleButton}`}
              data-testid="todo-title"
              aria-label={`Rename ${item.title}`}
              onPointerDown={(event) => {
                titlePress.current = { x: event.clientX, y: event.clientY };
              }}
              onClick={(event) => {
                const start = titlePress.current;
                titlePress.current = null;
                if (
                  event.detail === 0 ||
                  !start ||
                  Math.hypot(event.clientX - start.x, event.clientY - start.y) <
                    10
                )
                  setRenaming(true);
              }}
            >
              {item.title}
            </button>
          ) : (
            <span className={styles.title} data-testid="todo-title">
              {item.title}
            </span>
          )}

          {handle && onDelete && (
            <button
              type="button"
              className={styles.remove}
              aria-label={`Delete ${item.title}`}
              onClick={() => onDelete(item.id)}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

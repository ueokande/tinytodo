import type { ReactNode } from "react";
import { CheckIcon } from "../../../components/icons/CheckIcon.tsx";
import { TrashIcon } from "../../../components/icons/TrashIcon.tsx";
import type { Todo } from "../../../domain/todo.ts";
import { useSwipeCompletion } from "../hooks/useSwipeCompletion.ts";
import styles from "./TodoRow.module.css";

interface Props {
  item: Todo;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  handle?: ReactNode;
}
export function TodoRow({ item, onToggle, onDelete, handle }: Props) {
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
        <span className={styles.title} data-testid="todo-title">
          {item.title}
        </span>
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
    </div>
  );
}

import { CheckIcon } from "../../../components/icons/CheckIcon.tsx";
import type { Todo } from "../../../domain/todo.ts";
import { useSwipeCompletion } from "../hooks/useSwipeCompletion.ts";
import styles from "./TodoRow.module.css";

interface Props {
  item: Todo;
  onToggle: (id: string) => void;
}
export function TodoRow({ item, onToggle }: Props) {
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
        {...handlers}
      >
        <button
          type="button"
          className={styles.check}
          onClick={() => onToggle(item.id)}
          aria-label={`Mark ${item.title} as ${item.done ? "incomplete" : "complete"}`}
        >
          {item.done && <CheckIcon />}
        </button>
        <span className={styles.title} data-testid="todo-title">
          {item.title}
        </span>
      </div>
    </div>
  );
}

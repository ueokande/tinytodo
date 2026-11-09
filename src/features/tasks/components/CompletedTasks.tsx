import { useLayoutEffect, useRef, useState } from "react";
import type { Todo } from "../../../domain/todo.ts";
import { enter } from "../../../ui/motion.ts";
import styles from "./CompletedTasks.module.css";
import { TaskGroup } from "./TaskGroup.tsx";

interface Props {
  items: readonly Todo[];
  onToggle: (id: string) => void;
  onClear: () => void;
}
export function CompletedTasks({ items, onToggle, onClear }: Props) {
  const [folded, setFolded] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!folded && group.current) enter(group.current);
  }, [folded]);
  return (
    <section id="completed" hidden={!items.length}>
      <div className={styles.doneHeading}>
        <button
          id="fold"
          type="button"
          className={styles.fold}
          aria-expanded={!folded}
          aria-controls="done"
          onClick={() => setFolded((value) => !value)}
        >
          Completed <span id="done-count">{items.length}</span>{" "}
          <span id="chevron" aria-hidden="true">
            {folded ? "⌄" : "⌃"}
          </span>
        </button>
        <button
          id="clear"
          type="button"
          className={styles.clear}
          onClick={onClear}
        >
          Clear completed
        </button>
      </div>
      <TaskGroup
        id="done"
        ref={group}
        items={items}
        onToggle={onToggle}
        hidden={folded}
      />
    </section>
  );
}

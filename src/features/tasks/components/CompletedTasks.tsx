import { useLayoutEffect, useRef, useState } from "react";
import type { Todo } from "../../../domain/todo.ts";
import { enter } from "../../../ui/motion.ts";
import styles from "./CompletedTasks.module.css";
import { TaskGroup } from "./TaskGroup.tsx";

interface Props {
  items: readonly Todo[];
  onToggle: (id: string) => void;
  onClear: () => void;
  editing: boolean;
  onRename: (id: string, title: string) => boolean;
  onDelete: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
}
export function CompletedTasks({
  items,
  onToggle,
  onClear,
  editing,
  onDelete,
  onRename,
  onMove,
}: Props) {
  const [folded, setFolded] = useState(true);
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
        editing={editing}
        onDelete={onDelete}
        onRename={onRename}
        onMove={onMove}
      />
    </section>
  );
}

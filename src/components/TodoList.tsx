import { useLayoutEffect, useRef, useState } from "react";
import type { Board } from "../domain/board.ts";
import { captureListMotion } from "../ui/list-motion.ts";
import { enter } from "../ui/motion.ts";
import styles from "./TodoList.module.css";
import { TodoRow } from "./TodoRow.tsx";
export function TodoList({
  board,
  onToggle,
  onClear,
}: {
  board: Board;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [folded, setFolded] = useState(false);
  const container = useRef<HTMLElement>(null);
  const doneContainer = useRef<HTMLDivElement>(null);
  const previous = useRef<{ items: Board["items"]; finish: () => void } | null>(
    null,
  );
  useLayoutEffect(() => {
    if (!container.current || previous.current?.items === board.items) return;
    const finish = previous.current?.finish;
    previous.current = {
      items: board.items,
      finish: captureListMotion(container.current),
    };
    if (finish) finish();
    else enter(container.current);
  }, [board.items]);
  const active = board.items.filter((item) => !item.done),
    done = board.items.filter((item) => item.done);
  return (
    <section id="task-list" ref={container} aria-label="ToDoリスト">
      <div id="active" className={styles.items}>
        {active.map((item) => (
          <TodoRow key={item.id} item={item} onToggle={onToggle} />
        ))}
      </div>
      <section id="completed" hidden={!done.length}>
        <div className={styles.doneHeading}>
          <button
            id="fold"
            type="button"
            className={styles.fold}
            aria-expanded={!folded}
            aria-controls="done"
            onClick={() => {
              setFolded(!folded);
              if (folded && doneContainer.current) enter(doneContainer.current);
            }}
          >
            完了した項目 <span id="done-count">{done.length}</span>{" "}
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
            まとめて削除
          </button>
        </div>
        <div
          id="done"
          ref={doneContainer}
          className={styles.items}
          hidden={folded}
        >
          {done.map((item) => (
            <TodoRow key={item.id} item={item} onToggle={onToggle} />
          ))}
        </div>
      </section>
    </section>
  );
}

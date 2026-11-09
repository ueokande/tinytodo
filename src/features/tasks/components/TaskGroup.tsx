import type { Ref } from "react";
import type { Todo } from "../../../domain/todo.ts";
import styles from "./TaskGroup.module.css";
import { TodoRow } from "./TodoRow.tsx";

interface Props {
  id: string;
  items: readonly Todo[];
  onToggle: (id: string) => void;
  hidden?: boolean;
  ref?: Ref<HTMLDivElement>;
}
export function TaskGroup({ id, items, onToggle, hidden, ref }: Props) {
  return (
    <div id={id} ref={ref} className={styles.items} hidden={hidden}>
      {items.map((item) => (
        <TodoRow key={item.id} item={item} onToggle={onToggle} />
      ))}
    </div>
  );
}

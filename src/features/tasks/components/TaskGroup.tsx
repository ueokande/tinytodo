import type { Ref } from "react";
import { SortableList } from "../../../components/sorting/SortableList.tsx";
import type { Todo } from "../../../domain/todo.ts";
import styles from "./TaskGroup.module.css";
import { TodoRow } from "./TodoRow.tsx";

interface Props {
  id: string;
  items: readonly Todo[];
  onToggle: (id: string) => void;
  hidden?: boolean;
  editing: boolean;
  onRename: (id: string, title: string) => boolean;
  onDelete: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
  ref?: Ref<HTMLDivElement>;
}
export function TaskGroup({
  id,
  items,
  onToggle,
  hidden,
  ref,
  editing,
  onDelete,
  onRename,
  onMove,
}: Props) {
  return (
    <div id={id} ref={ref} className={styles.items} hidden={hidden}>
      {editing ? (
        <SortableList
          items={items.map((item) => ({ ...item, name: item.title }))}
          onMove={onMove}
        >
          {(item, handle) => (
            <TodoRow
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onRename={onRename}
              handle={handle}
            />
          )}
        </SortableList>
      ) : (
        items.map((item) => (
          <TodoRow key={item.id} item={item} onToggle={onToggle} />
        ))
      )}
    </div>
  );
}

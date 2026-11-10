import { useRef } from "react";
import type { Todo } from "../../../domain/todo.ts";
import { useTaskListMotion } from "../hooks/useTaskListMotion.ts";
import { CompletedTasks } from "./CompletedTasks.tsx";
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
export function TodoList({
  items,
  onToggle,
  onClear,
  editing,
  onDelete,
  onRename,
  onMove,
}: Props) {
  const container = useRef<HTMLElement>(null);
  useTaskListMotion(container, items, !editing);
  return (
    <section id="task-list" ref={container} aria-label="Tasks">
      <TaskGroup
        id="active"
        items={items.filter((item) => !item.done)}
        onToggle={onToggle}
        editing={editing}
        onDelete={onDelete}
        onRename={onRename}
        onMove={onMove}
      />
      <CompletedTasks
        items={items.filter((item) => item.done)}
        onToggle={onToggle}
        editing={editing}
        onDelete={onDelete}
        onRename={onRename}
        onMove={onMove}
        onClear={onClear}
      />
    </section>
  );
}

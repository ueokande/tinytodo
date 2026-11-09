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
  onDelete: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
}
export function TodoList({
  items,
  onToggle,
  onClear,
  editing,
  onDelete,
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
        onMove={onMove}
      />
      <CompletedTasks
        items={items.filter((item) => item.done)}
        onToggle={onToggle}
        editing={editing}
        onDelete={onDelete}
        onMove={onMove}
        onClear={onClear}
      />
    </section>
  );
}

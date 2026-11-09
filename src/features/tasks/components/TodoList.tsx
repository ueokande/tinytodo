import { useRef } from "react";
import type { Todo } from "../../../domain/todo.ts";
import { useTaskListMotion } from "../hooks/useTaskListMotion.ts";
import { CompletedTasks } from "./CompletedTasks.tsx";
import { TaskGroup } from "./TaskGroup.tsx";

interface Props {
  items: readonly Todo[];
  onToggle: (id: string) => void;
  onClear: () => void;
}
export function TodoList({ items, onToggle, onClear }: Props) {
  const container = useRef<HTMLElement>(null);
  useTaskListMotion(container, items);
  return (
    <section id="task-list" ref={container} aria-label="Tasks">
      <TaskGroup
        id="active"
        items={items.filter((item) => !item.done)}
        onToggle={onToggle}
      />
      <CompletedTasks
        items={items.filter((item) => item.done)}
        onToggle={onToggle}
        onClear={onClear}
      />
    </section>
  );
}

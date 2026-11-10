import { reorder } from "./reorder.ts";
export interface Todo {
  id: string;
  title: string;
  done: boolean;
}
export const MAX_TITLE_LENGTH = 200;
export function createItem(title: string): Todo | null {
  const clean = title.trim();
  if (!clean || clean.length > MAX_TITLE_LENGTH) return null;
  return { id: crypto.randomUUID(), title: clean, done: false };
}
export function toggle(items: readonly Todo[], id: string): Todo[] {
  return items.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item,
  );
}

/** Completed and active tasks cannot cross groups while being reordered. */
export function reorderTasks(
  items: readonly Todo[],
  id: string,
  targetId: string,
): Todo[] {
  const source = items.find((item) => item.id === id),
    target = items.find((item) => item.id === targetId);
  if (!source || !target || source.done !== target.done) return [...items];
  const group = reorder(
    items.filter((item) => item.done === source.done),
    id,
    targetId,
  );
  let index = 0;
  return items.map((item) =>
    item.done === source.done ? group[index++] : item,
  );
}

export function renameTask(
  items: readonly Todo[],
  id: string,
  title: string,
): Todo[] {
  const clean = title.trim();
  if (!clean || clean.length > MAX_TITLE_LENGTH)
    throw new Error("Invalid task title");
  if (!items.some((item) => item.id === id)) throw new Error("Task is missing");
  return items.map((item) =>
    item.id === id ? { ...item, title: clean } : item,
  );
}

import type { Todo } from "../domain/todo.ts";
export const KEY = "tiny.todos.v1";
export type TodoStorage = Pick<Storage, "getItem" | "setItem">;
export function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.done === "boolean"
  );
}
export function read(storage: Pick<TodoStorage, "getItem">): Todo[] {
  const raw = storage.getItem(KEY);
  if (!raw) return [];
  const items: unknown = JSON.parse(raw);
  if (!Array.isArray(items) || !items.every(isTodo))
    throw new Error("Invalid saved list");
  return items;
}
export function write(
  storage: Pick<TodoStorage, "setItem">,
  items: readonly Todo[],
): void {
  storage.setItem(KEY, JSON.stringify(items));
}

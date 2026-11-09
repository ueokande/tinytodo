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

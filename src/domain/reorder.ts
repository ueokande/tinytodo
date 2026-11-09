/** Move to the target's position while retaining every item and its identity. */
export function reorder<T extends { id: string }>(
  items: readonly T[],
  id: string,
  targetId: string,
): T[] {
  const from = items.findIndex((item) => item.id === id),
    to = items.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0 || from === to) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const KEY = 'tiny.todos.v1';
export function read(storage) {
  const raw = storage.getItem(KEY);
  if (!raw) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items) || items.some(x => !x || typeof x.id !== 'string' || typeof x.title !== 'string' || typeof x.done !== 'boolean')) throw new Error('Invalid saved list');
  return items;
}
export function write(storage, items) { storage.setItem(KEY, JSON.stringify(items)); }
export function createItem(title) {
  const clean = title.trim();
  if (!clean || clean.length > 200) return null;
  return {id: crypto.randomUUID(), title: clean, done: false};
}
export function toggle(items, id) { return items.map(item => item.id === id ? {...item, done: !item.done} : item); }

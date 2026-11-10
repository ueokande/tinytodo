import { assert, test } from "vitest";
import { createItem, renameTask, toggle } from "../src/domain/todo.ts";
import { read, write } from "../src/storage/todo-storage.ts";

test("titles are trimmed and empty or oversized entries rejected", () => {
  assert.equal(createItem(" Milk ")?.title, "Milk");
  assert.equal(createItem("  "), null);
  assert.equal(createItem("a".repeat(201)), null);
});
test("completion and undo persist across reloads", () => {
  let value: string | null = null;
  const storage = {
    getItem: () => value,
    setItem: (_k: string, v: string) => (value = v),
  };
  const milk = createItem("Milk");
  const bread = createItem("Bread");
  assert.ok(milk);
  assert.ok(bread);
  const items = [milk, bread];
  write(storage, toggle(items, items[0].id));
  const loaded = read(storage);
  assert.equal(loaded[0].done, true);
  assert.equal(loaded[1].done, false);
  write(storage, toggle(loaded, items[0].id));
  assert.equal(read(storage)[0].done, false);
});
test("corrupt data and failed writes surface errors", () => {
  assert.throws(() => read({ getItem: () => "{" }));
  assert.throws(() => read({ getItem: () => "[{}]" }));
  assert.throws(() =>
    write(
      {
        setItem: () => {
          throw Error("quota");
        },
      },
      [],
    ),
  );
});

test("renaming changes only the title and validates the task and length", () => {
  const items = [
    { id: "milk", title: "Milk", done: true },
    { id: "bread", title: "Bread", done: false },
  ];
  const renamed = renameTask(items, "milk", " Oat milk ");
  assert.deepEqual(renamed, [
    { id: "milk", title: "Oat milk", done: true },
    items[1],
  ]);
  assert.equal(items[0].title, "Milk");
  assert.throws(() => renameTask(items, "milk", " "));
  assert.throws(() => renameTask(items, "milk", "x".repeat(201)));
  assert.throws(() => renameTask(items, "missing", "Title"));
});

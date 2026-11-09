import { createItem, type Todo, toggle } from "./domain/todo.ts";
import { read, write } from "./storage/todo-storage.ts";
import layout from "./ui/layout.html?raw";
import { createToast } from "./ui/toast.ts";
import { createTodoRow } from "./ui/todo-row.ts";
export function mountApp(root: HTMLElement) {
  root.innerHTML = layout;
  let items: Todo[] = [];
  let folded = false;
  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing element: ${id}`);
    return element as T;
  };
  let storageAvailable = true;
  try {
    items = read(localStorage);
  } catch {
    storageAvailable = false;
  }
  const toast = createToast(
    $("toast"),
    $("message"),
    $<HTMLButtonElement>("undo"),
  );
  function commit(next: Todo[], message?: string): boolean {
    if (!storageAvailable) {
      toast("保存データを読み込めないため、変更できません。");
      return false;
    }
    try {
      write(localStorage, next);
    } catch {
      toast("保存できません。ブラウザの保存設定や空き容量をご確認ください。");
      return false;
    }
    const previous = items;
    items = next;
    render();
    if (message) toast(message, () => commit(previous));
    return true;
  }
  function render() {
    const active = items.filter((x) => !x.done),
      done = items.filter((x) => x.done);
    $("count").textContent = String(active.length);
    $("done-count").textContent = String(done.length);
    $("active").replaceChildren(
      ...active.map((item) =>
        createTodoRow(item, () =>
          commit(toggle(items, item.id), "完了しました"),
        ),
      ),
    );
    $("done").replaceChildren(
      ...done.map((item) =>
        createTodoRow(item, () =>
          commit(toggle(items, item.id), "未完了に戻しました"),
        ),
      ),
    );
    $("completed").hidden = !done.length;
    $("done").hidden = folded;
    $("fold").setAttribute("aria-expanded", String(!folded));
    $("chevron").textContent = folded ? "⌄" : "⌃";
  }
  $("add-form").onsubmit = (e) => {
    e.preventDefault();
    const item = createItem($<HTMLInputElement>("title").value);
    if (item && commit([...items, item])) {
      $<HTMLInputElement>("title").value = "";
      $<HTMLInputElement>("title").focus();
    }
  };
  $("fold").onclick = () => {
    folded = !folded;
    render();
  };
  $("clear").onclick = () =>
    commit(
      items.filter((x) => !x.done),
      "完了した項目を削除しました",
    );
  render();
  if (!storageAvailable)
    toast("保存データを読み込めませんでした。ブラウザの設定をご確認ください。");
  if ("serviceWorker" in navigator && import.meta.env.PROD)
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() =>
        toast(
          "オフラインの準備ができませんでした。オンラインで再読み込みしてください。",
        ),
      );
}

import type { Todo } from "../domain/todo.ts";
import { check } from "./icons.ts";
export function createTodoRow(item: Todo, onToggle: () => void) {
  const wrapper = document.createElement("div");
  wrapper.className = "swipe-row";
  const backdrop = document.createElement("div");
  backdrop.className = "swipe-back";
  backdrop.innerHTML = check;
  const el = document.createElement("div");
  el.className = `item${item.done ? " is-done" : ""}`;
  const button = document.createElement("button");
  button.className = "check";
  button.innerHTML = item.done ? check : "";
  button.setAttribute(
    "aria-label",
    `${item.title}を${item.done ? "未完了に戻す" : "完了にする"}`,
  );
  const title = document.createElement("span");
  title.className = "item-title";
  title.textContent = item.title;
  const grip = document.createElement("span");
  grip.className = "swipe-indicator";
  grip.textContent = "→";
  grip.setAttribute("aria-hidden", "true");
  const act = onToggle;
  button.onclick = act;
  el.append(button, title, grip);
  wrapper.append(backdrop, el);
  let start: { x: number; y: number; id: number } | null = null;
  let dx = 0;
  el.onpointerdown = (e) => {
    if (
      (e.target instanceof Element && e.target.closest("button")) ||
      !e.isPrimary ||
      e.button !== 0
    )
      return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dx = 0;
  };
  el.onpointermove = (e) => {
    if (!start) return;
    const x = e.clientX - start.x,
      y = e.clientY - start.y;
    if (Math.abs(y) > 12 && Math.abs(y) > Math.abs(x)) {
      reset();
      return;
    }
    if (x > 10) {
      el.setPointerCapture(e.pointerId);
      dx = Math.min(x, 140);
      el.style.transform = `translateX(${dx}px)`;
      wrapper.classList.toggle("ready", dx >= 80);
    }
  };
  function reset() {
    start = null;
    dx = 0;
    el.style.transform = "";
    wrapper.classList.remove("ready");
  }
  el.onpointerup = () => {
    const complete = dx >= 80;
    reset();
    if (complete) act();
  };
  el.onpointercancel = reset;
  return wrapper;
}

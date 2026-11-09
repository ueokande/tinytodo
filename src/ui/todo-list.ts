import type { Board } from "../domain/board.ts";
import { element } from "./dom.ts";
import { captureListMotion } from "./list-motion.ts";
import { enter } from "./motion.ts";
import { createTodoRow } from "./todo-row.ts";

export function createTodoList(
  root: HTMLElement,
  onToggle: (id: string) => void,
) {
  const list = element(root, "task-list", HTMLElement);
  const activeList = element(root, "active", HTMLElement);
  const doneList = element(root, "done", HTMLElement);
  const completed = element(root, "completed", HTMLElement);
  const count = element(root, "count", HTMLElement);
  const doneCount = element(root, "done-count", HTMLElement);
  const boardName = element(root, "board-name", HTMLElement);
  const fold = element(root, "fold", HTMLButtonElement);
  const chevron = element(root, "chevron", HTMLElement);
  let previousBoardId: string | undefined;
  let folded = false;
  function applyFold() {
    doneList.hidden = folded;
    fold.setAttribute("aria-expanded", String(!folded));
    chevron.textContent = folded ? "⌄" : "⌃";
  }
  fold.onclick = () => {
    folded = !folded;
    applyFold();
    if (!folded) enter(doneList);
  };
  return {
    render(board: Board) {
      const switching =
        previousBoardId !== undefined && previousBoardId !== board.id;
      const finishMotion =
        switching || previousBoardId === undefined
          ? () => {}
          : captureListMotion(list);
      if (switching) folded = false;
      const active = board.items.filter((item) => !item.done);
      const done = board.items.filter((item) => item.done);
      boardName.textContent = board.name;
      count.textContent = String(active.length);
      doneCount.textContent = String(done.length);
      const row = (item: Board["items"][number]) =>
        createTodoRow(item, () => onToggle(item.id));
      activeList.replaceChildren(...active.map(row));
      doneList.replaceChildren(...done.map(row));
      completed.hidden = !done.length;
      applyFold();
      previousBoardId = board.id;
      if (switching) enter(list, 0, 10);
      else finishMotion();
    },
  };
}

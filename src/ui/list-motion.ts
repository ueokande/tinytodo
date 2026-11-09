import { animate, enter, motion, reducedMotion } from "./motion.ts";

/** Measure before replacing rows, then animate their new positions (FLIP). */
export function captureListMotion(container: HTMLElement): () => void {
  if (reducedMotion()) return () => {};
  const previous = new Map(
    Array.from(container.querySelectorAll<HTMLElement>("[data-todo-id]")).map(
      (row) => [
        row.dataset.todoId,
        { row, bounds: row.getBoundingClientRect() },
      ],
    ),
  );
  return () => {
    const current = container.querySelectorAll<HTMLElement>("[data-todo-id]");
    const ids = new Set(Array.from(current, (row) => row.dataset.todoId));
    for (const row of current) {
      const old = previous.get(row.dataset.todoId);
      const bounds = row.getBoundingClientRect();
      if (bounds.height === 0) continue;
      const completionChanged =
        old &&
        Boolean(old.row.querySelector(".is-done")) !==
          Boolean(row.querySelector(".is-done"));
      if (completionChanged && row.querySelector(".is-done"))
        row.classList.add("just-completed");
      if (!old || old.bounds.height === 0 || completionChanged) {
        enter(row);
      } else {
        const delta = old.bounds.top - bounds.top;
        if (delta && Math.abs(delta) < window.innerHeight)
          animate(
            row,
            [
              { transform: `translateY(${delta}px)` },
              { transform: "translateY(0)" },
            ],
            motion.settle,
          );
      }
    }
    for (const [id, { row, bounds }] of previous) {
      if (
        ids.has(id) ||
        !bounds.height ||
        bounds.bottom < 0 ||
        bounds.top > window.innerHeight
      )
        continue;
      const ghost = row.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-todo-id");
      ghost.setAttribute("aria-hidden", "true");
      ghost.inert = true;
      Object.assign(ghost.style, {
        position: "fixed",
        top: `${bounds.top}px`,
        left: `${bounds.left}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        pointerEvents: "none",
        zIndex: "1",
      });
      document.body.append(ghost);
      const exit = animate(
        ghost,
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: "translateX(24px)" },
        ],
        motion.exit,
      );
      if (exit)
        void exit.finished.then(
          () => ghost.remove(),
          () => ghost.remove(),
        );
      else ghost.remove();
    }
  };
}

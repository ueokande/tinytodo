import { animate, motion } from "./motion.ts";
export function createToast(
  container: HTMLElement,
  messageElement: HTMLElement,
  undoButton: HTMLButtonElement,
) {
  let animation: Animation | null = null;
  function hide() {
    animation?.cancel();
    const exit = animate(
      container,
      [
        { opacity: 1, translate: "0 0" },
        { opacity: 0, translate: "0 8px" },
      ],
      motion.exit,
    );
    animation = exit;
    if (exit)
      void exit.finished.then(
        () => {
          if (animation === exit) container.hidden = true;
        },
        () => {},
      );
    else container.hidden = true;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  let undo: (() => void) | undefined;
  undoButton.onclick = () => {
    const action = undo;
    undo = undefined;
    clearTimeout(timer);
    animation?.cancel();
    container.hidden = true;
    action?.();
  };
  const notify = (message: string, action?: () => void): void => {
    clearTimeout(timer);
    undo = action;
    messageElement.textContent = message;
    undoButton.hidden = !action;
    animation?.cancel();
    container.hidden = false;
    animation = animate(container, [
      { opacity: 0, translate: "0 8px" },
      { opacity: 1, translate: "0 0" },
    ]);
    timer = setTimeout(() => {
      hide();
      undo = undefined;
    }, 7000);
  };
  return Object.assign(notify, {
    dismiss() {
      clearTimeout(timer);
      undo = undefined;
      animation?.cancel();
      container.hidden = true;
    },
  });
}

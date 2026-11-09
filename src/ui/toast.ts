export function createToast(
  container: HTMLElement,
  messageElement: HTMLElement,
  undoButton: HTMLButtonElement,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let undo: (() => void) | undefined;
  undoButton.onclick = () => {
    const action = undo;
    undo = undefined;
    clearTimeout(timer);
    container.hidden = true;
    action?.();
  };
  const notify = (message: string, action?: () => void): void => {
    clearTimeout(timer);
    undo = action;
    messageElement.textContent = message;
    undoButton.hidden = !action;
    container.hidden = false;
    timer = setTimeout(() => {
      container.hidden = true;
      undo = undefined;
    }, 7000);
  };
  return Object.assign(notify, {
    dismiss() {
      clearTimeout(timer);
      undo = undefined;
      container.hidden = true;
    },
  });
}

import { animate, motion } from "./motion.ts";

/** Dialog stays modal during exit; Escape/backdrop/button/drag share one close path. */
export function createSheetMotion(
  dialog: HTMLDialogElement,
  closingClass: string,
) {
  const controller = new AbortController();
  let animation: Animation | null = null;
  let closing = false;
  let revision = 0;
  let drag: { id: number; y: number; time: number; distance: number } | null =
    null;
  function run(frames: Keyframe[], duration: number) {
    animation?.cancel();
    animation = animate(dialog, frames, duration);
    return animation;
  }
  function close() {
    if (!dialog.open || closing) return;
    const closingRevision = ++revision;
    closing = true;
    if (drag && dialog.hasPointerCapture(drag.id))
      dialog.releasePointerCapture(drag.id);
    drag = null;
    dialog.classList.add(closingClass);
    const from = getComputedStyle(dialog).transform;
    const exit = run(
      [{ transform: from }, { transform: "translateY(100%)" }],
      motion.exit,
    );
    const finish = () => {
      if (revision !== closingRevision || !closing) return;
      dialog.style.transform = "";
      dialog.close();
      dialog.classList.remove(closingClass);
      closing = false;
    };
    if (exit) void exit.finished.then(finish, finish);
    else finish();
  }
  // Native Back/Escape can close a dialog independently of an in-flight exit.
  dialog.addEventListener(
    "close",
    () => {
      if (dialog.open) return;
      revision++;
      animation?.cancel();
      closing = false;
      drag = null;
      dialog.style.transform = "";
      dialog.classList.remove(closingClass);
    },
    { signal: controller.signal },
  );
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      close();
    },
    { signal: controller.signal },
  );
  dialog.addEventListener(
    "pointerdown",
    (event) => {
      if (
        closing ||
        !event.isPrimary ||
        event.button !== 0 ||
        !(event.target instanceof Element) ||
        !event.target.closest("[data-sheet-drag]") ||
        event.target.closest("button")
      )
        return;
      animation?.cancel();
      drag = {
        id: event.pointerId,
        y: event.clientY,
        time: performance.now(),
        distance: 0,
      };
      dialog.setPointerCapture(event.pointerId);
    },
    { signal: controller.signal },
  );
  dialog.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      drag.distance = Math.max(0, event.clientY - drag.y);
      dialog.style.transform = `translateY(${drag.distance}px)`;
    },
    { signal: controller.signal },
  );
  function endDrag(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return;
    const { distance, time } = drag;
    drag = null;
    if (dialog.hasPointerCapture(event.pointerId))
      dialog.releasePointerCapture(event.pointerId);
    if (
      event.type !== "pointercancel" &&
      (distance > 80 ||
        (distance > 20 &&
          distance / Math.max(1, performance.now() - time) > 0.5))
    ) {
      close();
    } else {
      run(
        [
          { transform: `translateY(${distance}px)` },
          { transform: "translateY(0)" },
        ],
        motion.settle,
      );
      dialog.style.transform = "";
    }
  }
  dialog.addEventListener("pointerup", endDrag, { signal: controller.signal });
  dialog.addEventListener("pointercancel", endDrag, {
    signal: controller.signal,
  });
  return {
    close,
    dispose() {
      controller.abort();
      revision++;
      animation?.cancel();
      dialog.style.transform = "";
      dialog.classList.remove(closingClass);
    },
    open() {
      if (dialog.open) return;
      revision++;
      closing = false;
      dialog.classList.remove(closingClass);
      dialog.showModal();
      run(
        [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
        motion.settle,
      );
    },
  };
}

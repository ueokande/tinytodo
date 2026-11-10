import { type RefObject, useLayoutEffect, useRef } from "react";
import type { Todo } from "../../../domain/todo.ts";
import { captureListMotion } from "../../../ui/list-motion.ts";
import { enter } from "../../../ui/motion.ts";
export function useTaskListMotion(
  container: RefObject<HTMLElement | null>,
  items: readonly Todo[],
  enabled = true,
) {
  const previous = useRef<{
    items: readonly Todo[];
    finish: () => void;
  } | null>(null);
  useLayoutEffect(() => {
    // Sortable owns transforms in edit mode; do not stack two layout animations.
    if (!enabled) {
      previous.current = null;
      return;
    }
    if (!container.current || previous.current?.items === items) return;
    const finish = previous.current?.finish;
    previous.current = { items, finish: captureListMotion(container.current) };
    if (finish) finish();
    else enter(container.current);
  }, [container, items, enabled]);
}

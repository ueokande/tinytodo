import { type PointerEvent, useEffect, useRef } from "react";
import type { Todo } from "../domain/todo.ts";
import { animate, motion } from "../ui/motion.ts";
import { CheckIcon } from "./CheckIcon.tsx";
import styles from "./TodoRow.module.css";
export function TodoRow({
  item,
  onToggle,
}: {
  item: Todo;
  onToggle: (id: string) => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    distance: number;
  } | null>(null);
  const settling = useRef<Animation | null>(null);
  useEffect(
    () => () => {
      settling.current?.cancel();
    },
    [],
  );
  const reset = () => {
    const distance = gesture.current?.distance ?? 0;
    gesture.current = null;
    if (!content.current || !wrapper.current) return;
    content.current.style.transform = "";
    wrapper.current.classList.remove(styles.ready);
    if (distance)
      settling.current = animate(
        content.current,
        [
          { transform: `translateX(${distance}px)` },
          { transform: "translateX(0)" },
        ],
        motion.settle,
      );
  };
  const down = (event: PointerEvent) => {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest("button"))
    )
      return;
    settling.current?.cancel();
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      distance: 0,
    };
  };
  const move = (event: PointerEvent) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      reset();
      return;
    }
    if (dx > 10 && content.current && wrapper.current) {
      content.current.setPointerCapture(event.pointerId);
      start.distance = Math.min(dx, 140);
      content.current.style.transform = `translateX(${start.distance}px)`;
      wrapper.current.classList.toggle(styles.ready, start.distance >= 80);
    }
  };
  return (
    <div
      ref={wrapper}
      className={styles.row}
      data-todo-id={item.id}
      data-done={item.done}
    >
      <div className={styles.backdrop}>
        <CheckIcon />
      </div>
      <div
        ref={content}
        className={`${styles.item} ${item.done ? styles.done : ""}`}
        data-testid="todo-content"
        onPointerDown={down}
        onPointerMove={move}
        onPointerCancel={reset}
        onPointerUp={() => {
          const complete = (gesture.current?.distance ?? 0) >= 80;
          reset();
          if (complete) onToggle(item.id);
        }}
      >
        <button
          type="button"
          className={styles.check}
          onClick={() => onToggle(item.id)}
          aria-label={`${item.title}を${item.done ? "未完了に戻す" : "完了にする"}`}
        >
          {item.done && <CheckIcon />}
        </button>
        <span className={styles.title} data-testid="todo-title">
          {item.title}
        </span>
      </div>
    </div>
  );
}

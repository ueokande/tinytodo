import { type PointerEvent, useEffect, useRef, useState } from "react";
import { animate, motion } from "../../../ui/motion.ts";

const COMPLETE_DISTANCE = 80;
export function useSwipeCompletion(onComplete: () => void) {
  const contentRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    distance: number;
  } | null>(null);
  const settling = useRef<Animation | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => () => settling.current?.cancel(), []);
  function reset() {
    const distance = gesture.current?.distance ?? 0;
    gesture.current = null;
    setReady(false);
    if (!contentRef.current) return;
    contentRef.current.style.transform = "";
    if (distance)
      settling.current = animate(
        contentRef.current,
        [
          { transform: `translateX(${distance}px)` },
          { transform: "translateX(0)" },
        ],
        motion.settle,
      );
  }
  function onPointerDown(event: PointerEvent) {
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
  }
  function onPointerMove(event: PointerEvent) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      reset();
      return;
    }
    if (dx > 10 && contentRef.current) {
      contentRef.current.setPointerCapture(event.pointerId);
      start.distance = Math.min(dx, 140);
      contentRef.current.style.transform = `translateX(${start.distance}px)`;
      setReady(start.distance >= COMPLETE_DISTANCE);
    }
  }
  function onPointerUp() {
    const complete = (gesture.current?.distance ?? 0) >= COMPLETE_DISTANCE;
    reset();
    if (complete) onComplete();
  }
  return {
    contentRef,
    ready,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: reset,
  };
}

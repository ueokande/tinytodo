/** Shared motion timings. State changes and persistence never wait for animation. */
export const motion = {
  enter: 220,
  exit: 160,
  settle: 260,
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)",
};
export function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function animate(
  element: HTMLElement,
  frames: Keyframe[],
  duration = motion.enter,
): Animation | null {
  if (reducedMotion() || typeof element.animate !== "function") return null;
  return element.animate(frames, { duration, easing: motion.ease });
}
export function enter(element: HTMLElement, x = 0, y = 8): void {
  animate(element, [
    { opacity: 0, transform: `translate(${x}px, ${y}px)` },
    { opacity: 1, transform: "translate(0, 0)" },
  ]);
}

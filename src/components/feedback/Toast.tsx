import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Notice } from "../../hooks/useToast.ts";
import { animate, motion } from "../../ui/motion.ts";
import styles from "./Toast.module.css";
export function Toast({
  notice,
  onDismiss,
}: {
  notice: Notice | null;
  onDismiss: () => void;
}) {
  const [shown, setShown] = useState(notice);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (notice) {
      setShown(notice);
      return;
    }
    if (!container.current) return;
    const exit = animate(
      container.current,
      [
        { opacity: 1, translate: "0 0" },
        { opacity: 0, translate: "0 8px" },
      ],
      motion.exit,
    );
    if (!exit) {
      setShown(null);
      return;
    }
    void exit.finished.then(
      () => setShown(null),
      () => {},
    );
    return () => exit.cancel();
  }, [notice]);
  useLayoutEffect(() => {
    if (!shown || !container.current) return;
    const animation = animate(container.current, [
      { opacity: 0, translate: "0 8px" },
      { opacity: 1, translate: "0 0" },
    ]);
    return () => animation?.cancel();
  }, [shown]);
  return (
    <div
      id="toast"
      className={styles.toast}
      ref={container}
      role="status"
      hidden={!shown}
    >
      <span id="message">{shown?.message}</span>
      <button
        id="undo"
        className={styles.undo}
        type="button"
        hidden={!shown?.undo}
        disabled={!notice}
        onClick={() => {
          onDismiss();
          notice?.undo?.();
        }}
      >
        Undo
      </button>
    </div>
  );
}

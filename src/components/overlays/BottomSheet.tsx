import {
  type ReactNode,
  type Ref,
  type RefObject,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { createSheetMotion } from "../../ui/sheet-motion.ts";
import { Button } from "../controls/Button.tsx";
import styles from "./BottomSheet.module.css";
export interface BottomSheetHandle {
  close: () => void;
}
interface Props {
  id: string;
  label: string;
  children: ReactNode;
  ref?: Ref<BottomSheetHandle>;
  onClose: () => void;
  onBack?: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}
export function BottomSheet({
  id,
  label,
  children,
  ref,
  onClose,
  onBack,
  initialFocusRef,
  returnFocusRef,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const motion = useRef<ReturnType<typeof createSheetMotion> | null>(null);
  useLayoutEffect(() => {
    if (!dialog.current) return;
    const controller = createSheetMotion(dialog.current, styles.closing);
    motion.current = controller;
    controller.open();
    initialFocusRef?.current?.focus();
    return () => {
      controller.dispose();
      motion.current = null;
    };
  }, [initialFocusRef]);
  useImperativeHandle(
    ref,
    () => ({ close: () => motion.current?.close() }),
    [],
  );
  return (
    <dialog
      id={id}
      ref={dialog}
      className={styles.sheet}
      aria-label={label}
      onClose={() => {
        returnFocusRef?.current?.focus({ preventScroll: true });
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          motion.current?.close();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          motion.current?.close();
      }}
    >
      <div
        className={styles.handle}
        data-sheet-drag="handle"
        aria-hidden="true"
      />
      <div className={styles.toolbar} data-sheet-drag="toolbar">
        <Button
          className={styles.back}
          aria-label="Back"
          hidden={!onBack}
          onClick={onBack}
        >
          ←
        </Button>
        <Button
          className={styles.close}
          aria-label="Close"
          onClick={() => motion.current?.close()}
        >
          ×
        </Button>
      </div>
      {children}
    </dialog>
  );
}

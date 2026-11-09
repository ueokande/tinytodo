import { useLayoutEffect, useRef } from "react";
import { Button } from "../../../components/controls/Button.tsx";
import styles from "./DeleteBoardConfirmation.module.css";

interface Props {
  name: string;
  taskCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}
export function DeleteBoardConfirmation({
  name,
  taskCount,
  onCancel,
  onConfirm,
}: Props) {
  const cancel = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => cancel.current?.focus(), []);
  return (
    <section id="board-confirm" className={styles.confirm}>
      <h2 className={styles.heading}>Delete “{name}”?</h2>
      <p id="board-delete-detail">
        {taskCount}
        {taskCount === 1 ? " task" : " tasks"} will also be deleted. This cannot
        be undone.
      </p>
      <div className={styles.confirmButtons}>
        <Button id="board-cancel" ref={cancel} onClick={onCancel}>
          Cancel
        </Button>
        <Button id="board-delete-confirm" variant="danger" onClick={onConfirm}>
          Delete board
        </Button>
      </div>
    </section>
  );
}

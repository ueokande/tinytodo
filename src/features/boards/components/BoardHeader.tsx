import type { Ref } from "react";
import styles from "./BoardHeader.module.css";

interface Props {
  name: string;
  remainingCount: number;
  onOpen: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}
export function BoardHeader({
  name,
  remainingCount,
  onOpen,
  buttonRef,
}: Props) {
  return (
    <h1 className={styles.heading}>
      <button
        ref={buttonRef}
        type="button"
        id="board-switch"
        className={styles.boardSwitch}
        aria-haspopup="dialog"
        aria-controls="board-picker"
        onClick={onOpen}
      >
        <span id="board-name" className={styles.boardName}>
          {name}
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      <span id="count" className={styles.count}>
        {remainingCount}
      </span>
    </h1>
  );
}

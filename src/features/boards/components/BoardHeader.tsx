import type { Ref } from "react";
import styles from "./BoardHeader.module.css";

interface Props {
  name: string;
  editing: boolean;
  onEdit: () => void;
  remainingCount: number;
  onOpen: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}
export function BoardHeader({
  name,
  editing,
  onEdit,
  remainingCount,
  onOpen,
  buttonRef,
}: Props) {
  return (
    <div className={styles.headerContent}>
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
      <button type="button" className={styles.edit} onClick={onEdit}>
        {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}

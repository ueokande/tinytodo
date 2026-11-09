import type { Ref } from "react";
import { Button } from "../../../components/controls/Button.tsx";
import { CheckIcon } from "../../../components/icons/CheckIcon.tsx";
import type { Board } from "../../../domain/board.ts";
import styles from "./BoardList.module.css";

interface Props {
  boards: readonly Board[];
  selectedId: string;
  selectedRef: Ref<HTMLButtonElement>;
  onSelect: (id: string) => void;
  onOptions: (board: Board) => void;
  onCreate: () => void;
}
export function BoardList({
  boards,
  selectedId,
  selectedRef,
  onSelect,
  onOptions,
  onCreate,
}: Props) {
  return (
    <div id="board-overview">
      <div id="board-list">
        {boards.map((board) => (
          <div key={board.id} className={styles.row}>
            <Button
              ref={board.id === selectedId ? selectedRef : undefined}
              className={styles.select}
              aria-label={`Switch to ${board.name}`}
              aria-current={board.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(board.id)}
            >
              <span>{board.name}</span>
              {board.id === selectedId && (
                <span className={styles.check}>
                  <CheckIcon />
                </span>
              )}
            </Button>
            <Button
              className={styles.menu}
              aria-label={`Options for ${board.name}`}
              onClick={() => onOptions(board)}
            >
              ⋮
            </Button>
          </div>
        ))}
      </div>
      <Button id="board-add" className={styles.add} onClick={onCreate}>
        + Add board
      </Button>
    </div>
  );
}

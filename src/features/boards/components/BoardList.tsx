import type { Ref } from "react";
import { Button } from "../../../components/controls/Button.tsx";
import { CheckIcon } from "../../../components/icons/CheckIcon.tsx";
import { SortableList } from "../../../components/sorting/SortableList.tsx";
import type { Board } from "../../../domain/board.ts";
import styles from "./BoardList.module.css";

interface Props {
  boards: readonly Board[];
  selectedId: string;
  selectedRef: Ref<HTMLButtonElement>;
  onSelect: (id: string) => void;
  onOptions: (board: Board) => void;
  onCreate: () => void;
  editing: boolean;
  onMove: (id: string, targetId: string) => void;
  archivedCount: number;
  onArchived: () => void;
}
export function BoardList({
  boards,
  selectedId,
  selectedRef,
  onSelect,
  onOptions,
  onCreate,
  editing,
  onMove,
  archivedCount,
  onArchived,
}: Props) {
  return (
    <div id="board-overview">
      <div id="board-list">
        {editing ? (
          <SortableList items={boards} onMove={onMove}>
            {(board, handle) => (
              <div className={styles.row}>
                {handle}
                <span className={styles.sortName}>{board.name}</span>
                {board.id === selectedId && (
                  <span className={styles.check}>
                    <CheckIcon />
                  </span>
                )}
              </div>
            )}
          </SortableList>
        ) : (
          boards.map((board) => (
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
          ))
        )}
      </div>
      {!editing && (
        <>
          <Button id="board-add" className={styles.add} onClick={onCreate}>
            + Add board
          </Button>
          {archivedCount > 0 && (
            <Button className={styles.archive} onClick={onArchived}>
              Archived
            </Button>
          )}
        </>
      )}
    </div>
  );
}

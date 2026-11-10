import { Button } from "../../../components/controls/Button.tsx";
import type { Board } from "../../../domain/board.ts";
import styles from "./ArchivedBoards.module.css";
export function ArchivedBoards({
  boards,
  onRestore,
}: {
  boards: readonly Board[];
  onRestore: (id: string) => void;
}) {
  return (
    <section aria-label="Archived boards">
      <h2 className={styles.heading}>Archived</h2>
      {boards.map((board) => (
        <div key={board.id} className={styles.row}>
          <span className={styles.name}>{board.name}</span>
          <Button
            aria-label={`Restore ${board.name}`}
            onClick={() => onRestore(board.id)}
          >
            Restore
          </Button>
        </div>
      ))}
    </section>
  );
}

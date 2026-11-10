import { useLayoutEffect, useRef } from "react";
import { Button } from "../../../components/controls/Button.tsx";
import styles from "./BoardActions.module.css";

interface Props {
  name: string;
  canDelete: boolean;
  canArchive: boolean;
  onArchive: () => void;
  onRename: () => void;
  onDelete: () => void;
}
export function BoardActions({
  name,
  canDelete,
  canArchive,
  onArchive,
  onRename,
  onDelete,
}: Props) {
  const rename = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => rename.current?.focus(), []);
  return (
    <section id="board-actions" className={styles.actions}>
      <h2 className={styles.heading}>{name}</h2>
      <Button ref={rename} id="board-rename" onClick={onRename}>
        Rename
      </Button>
      <Button
        disabled={!canArchive}
        title={
          canArchive ? undefined : "You cannot archive the last active board"
        }
        onClick={onArchive}
      >
        Archive
      </Button>
      <Button
        id="board-delete"
        variant="danger"
        disabled={!canDelete}
        title={
          canDelete ? undefined : "You cannot delete the last active board"
        }
        onClick={onDelete}
      >
        Delete
      </Button>
    </section>
  );
}

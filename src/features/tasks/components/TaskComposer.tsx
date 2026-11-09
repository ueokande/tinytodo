import { type FormEvent, useEffect, useRef } from "react";
import { MAX_TITLE_LENGTH } from "../../../domain/todo.ts";
import { positionComposer } from "../../../ui/composer.ts";
import styles from "./TaskComposer.module.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => boolean;
}
export function TaskComposer({ value, onChange, onAdd }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (container.current) return positionComposer(container.current);
  }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (onAdd()) input.current?.focus({ preventScroll: true });
  };
  return (
    <div id="composer" className={styles.composer} ref={container}>
      <form id="add-form" className={styles.form} onSubmit={submit}>
        <input
          id="title"
          ref={input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="New task title"
          placeholder="Add a task"
          maxLength={MAX_TITLE_LENGTH}
          autoComplete="off"
          enterKeyHint="done"
          required
        />
        <button type="submit" className={styles.add} aria-label="Add task">
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </div>
  );
}

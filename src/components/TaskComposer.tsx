import { type FormEvent, useEffect, useRef } from "react";
import { positionComposer } from "../ui/composer.ts";
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
          aria-label="新しい項目のタイトル"
          placeholder="追加"
          maxLength={200}
          autoComplete="off"
          enterKeyHint="done"
          required
        />
        <button type="submit" className={styles.add} aria-label="項目を追加">
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </div>
  );
}

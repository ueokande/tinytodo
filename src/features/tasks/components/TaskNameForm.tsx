import { type FormEvent, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../../components/controls/Button.tsx";
import { MAX_TITLE_LENGTH } from "../../../domain/todo.ts";
import styles from "./TaskNameForm.module.css";

interface Props {
  initialTitle: string;
  onSave: (title: string) => boolean;
  onCancel: () => void;
}
export function TaskNameForm({ initialTitle, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initialTitle),
    [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean || clean.length > MAX_TITLE_LENGTH) {
      input.current?.setCustomValidity(
        `Enter a task title between 1 and ${MAX_TITLE_LENGTH} characters.`,
      );
      input.current?.reportValidity();
      return;
    }
    setError(!onSave(clean));
  }
  return (
    <form
      className={styles.form}
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <input
        ref={input}
        aria-label="Task title"
        value={title}
        onChange={(event) => {
          event.currentTarget.setCustomValidity("");
          setTitle(event.target.value);
          setError(false);
        }}
        maxLength={MAX_TITLE_LENGTH}
        autoComplete="off"
        enterKeyHint="done"
        required
      />
      <p role="alert" className={styles.error} hidden={!error}>
        Unable to save. Your changes have been kept here.
      </p>
      <div className={styles.actions}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
}

import { type FormEvent, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../../components/controls/Button.tsx";
import { MAX_BOARD_NAME_LENGTH } from "../../../domain/board.ts";
import styles from "./BoardNameForm.module.css";

interface Props {
  mode: "create" | "rename";
  initialName?: string;
  validate: (name: string) => boolean;
  onSubmit: (name: string) => void;
}
export function BoardNameForm({
  mode,
  initialName = "",
  validate,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName);
  const input = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate(name)) {
      input.current?.setCustomValidity(
        "Enter a unique name between 1 and 40 characters.",
      );
      input.current?.reportValidity();
      return;
    }
    onSubmit(name.trim());
  }
  return (
    <form id="board-form" className={styles.form} onSubmit={submit}>
      <label htmlFor="board-title">
        {mode === "rename" ? "Rename board" : "New board"}
      </label>
      <input
        id="board-title"
        ref={input}
        value={name}
        onChange={(event) => {
          event.currentTarget.setCustomValidity("");
          setName(event.target.value);
        }}
        maxLength={MAX_BOARD_NAME_LENGTH}
        autoComplete="off"
        required
      />
      <Button
        type="submit"
        id="board-save"
        variant="primary"
        className={styles.save}
      >
        {mode === "rename" ? "Save" : "Create"}
      </Button>
    </form>
  );
}

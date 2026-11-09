// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { BoardNameForm } from "../src/features/boards/components/BoardNameForm.tsx";

afterEach(cleanup);
test("board form owns its draft, rejects duplicates, and submits a trimmed name", () => {
  const submit = vi.fn();
  render(
    <BoardNameForm
      mode="create"
      validate={(name) => Boolean(name.trim()) && name.trim() !== "Notes"}
      onSubmit={submit}
    />,
  );
  const input = screen.getByLabelText<HTMLInputElement>("New board");
  expect(document.activeElement).toBe(input);
  const form = input.form;
  if (!form) throw new Error("Board form missing");
  fireEvent.change(input, { target: { value: "Notes" } });
  fireEvent.submit(form);
  expect(submit).not.toHaveBeenCalled();
  expect(input.validity.valid).toBe(false);
  expect(input.value).toBe("Notes");
  fireEvent.change(input, { target: { value: " Travel " } });
  fireEvent.submit(form);
  expect(input.validity.valid).toBe(true);
  expect(submit).toHaveBeenCalledExactlyOnceWith("Travel");
});
test("rename form starts with the selected board name and does not mutate it while typing", () => {
  const submit = vi.fn();
  render(
    <BoardNameForm
      mode="rename"
      initialName="Shopping"
      validate={() => true}
      onSubmit={submit}
    />,
  );
  const input = screen.getByLabelText<HTMLInputElement>("Rename board");
  expect(input.value).toBe("Shopping");
  fireEvent.change(input, { target: { value: "Groceries" } });
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).toHaveBeenCalledExactlyOnceWith("Groceries");
});

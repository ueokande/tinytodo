// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { TaskNameForm } from "../src/features/tasks/components/TaskNameForm.tsx";

afterEach(cleanup);
test("task rename rejects blank titles and submits trimmed text", () => {
  const save = vi.fn(() => true);
  render(
    <TaskNameForm initialTitle="Milk" onSave={save} onCancel={() => {}} />,
  );
  const input = screen.getByRole<HTMLInputElement>("textbox", {
    name: "Task title",
  });
  expect(document.activeElement).toBe(input);
  const form = input.form;
  if (!form) throw new Error("Form missing");
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.submit(form);
  expect(save).not.toHaveBeenCalled();
  expect(input.validity.valid).toBe(false);
  fireEvent.change(input, { target: { value: " Oat milk " } });
  fireEvent.submit(form);
  expect(save).toHaveBeenCalledExactlyOnceWith("Oat milk");
});
test("failed saves retain the draft and Escape cancels without saving", () => {
  const save = vi.fn(() => false),
    cancel = vi.fn();
  render(<TaskNameForm initialTitle="Milk" onSave={save} onCancel={cancel} />);
  const input = screen.getByRole<HTMLInputElement>("textbox", {
    name: "Task title",
  });
  fireEvent.change(input, { target: { value: "Oat milk" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(input.value).toBe("Oat milk");
  expect(screen.getByRole("alert").textContent).toContain("Unable to save");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(cancel).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledOnce();
});

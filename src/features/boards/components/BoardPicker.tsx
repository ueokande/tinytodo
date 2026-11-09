import {
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "../../../components/overlays/BottomSheet.tsx";
import { type Board, validBoardName } from "../../../domain/board.ts";
import { enter } from "../../../ui/motion.ts";
import { BoardActions } from "./BoardActions.tsx";
import { BoardList } from "./BoardList.tsx";
import { BoardNameForm } from "./BoardNameForm.tsx";
import styles from "./BoardPicker.module.css";
import { DeleteBoardConfirmation } from "./DeleteBoardConfirmation.tsx";

type Page =
  | { type: "list" | "create" }
  | { type: "actions" | "rename" | "delete"; board: Board };
interface View {
  boards: readonly Board[];
  selectedId: string;
}
interface Props extends View {
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSelect: (id: string) => boolean;
  onCreate: (name: string) => boolean;
  onRename: (id: string, name: string) => boolean;
  onDelete: (id: string) => boolean;
}
/** Navigation and outgoing-panel lifetime only; each panel owns its local interaction. */
export function BoardPicker({
  boards,
  selectedId,
  returnFocusRef,
  onClose,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [page, setPage] = useState<Page>({ type: "list" });
  const [error, setError] = useState<string | null>(null);
  const [exitView, setExitView] = useState<View | null>(null);
  const view = exitView ?? { boards, selectedId };
  const sheet = useRef<BottomSheetHandle>(null);
  const selected = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (panel.current) enter(panel.current, page.type === "list" ? -12 : 12, 0);
  }, [page.type]);
  function navigate(next: Page) {
    setError(null);
    setPage(next);
  }
  function attempt(action: () => boolean) {
    if (action()) {
      setExitView(view);
      sheet.current?.close();
    } else
      setError(
        "Unable to save. Check your storage settings and available space.",
      );
  }
  const target = "board" in page ? page.board : undefined;
  let content: ReactNode;
  switch (page.type) {
    case "list":
      content = (
        <BoardList
          boards={view.boards}
          selectedId={view.selectedId}
          selectedRef={selected}
          onSelect={(id) => attempt(() => onSelect(id))}
          onOptions={(board) => navigate({ type: "actions", board })}
          onCreate={() => navigate({ type: "create" })}
        />
      );
      break;
    case "create":
      content = (
        <BoardNameForm
          mode="create"
          validate={(name) => validBoardName({ boards: view.boards }, name)}
          onSubmit={(name) => attempt(() => onCreate(name))}
        />
      );
      break;
    case "rename":
      content = (
        <BoardNameForm
          mode="rename"
          initialName={page.board.name}
          validate={(name) =>
            validBoardName({ boards: view.boards }, name, page.board.id)
          }
          onSubmit={(name) => attempt(() => onRename(page.board.id, name))}
        />
      );
      break;
    case "actions":
      content = (
        <BoardActions
          name={page.board.name}
          canDelete={view.boards.length > 1}
          onRename={() => navigate({ type: "rename", board: page.board })}
          onDelete={() => navigate({ type: "delete", board: page.board })}
        />
      );
      break;
    case "delete":
      content = (
        <DeleteBoardConfirmation
          name={page.board.name}
          taskCount={page.board.items.length}
          onCancel={() => navigate({ type: "list" })}
          onConfirm={() => attempt(() => onDelete(page.board.id))}
        />
      );
      break;
  }
  return (
    <BottomSheet
      id="board-picker"
      label="Boards"
      ref={sheet}
      onClose={onClose}
      onBack={
        page.type === "list" ? undefined : () => navigate({ type: "list" })
      }
      initialFocusRef={selected}
      returnFocusRef={returnFocusRef}
    >
      <p id="board-error" className={styles.error} role="alert" hidden={!error}>
        {error}
      </p>
      <div ref={panel} key={`${page.type}:${target?.id ?? ""}`}>
        {content}
      </div>
    </BottomSheet>
  );
}

import { useEffect, useRef, useState } from "react";
import { Toast } from "./components/feedback/Toast.tsx";
import { BoardHeader } from "./features/boards/components/BoardHeader.tsx";
import { BoardPicker } from "./features/boards/components/BoardPicker.tsx";
import { TaskComposer } from "./features/tasks/components/TaskComposer.tsx";
import { TodoList } from "./features/tasks/components/TodoList.tsx";
import { useTodoApp } from "./hooks/useTodoApp.ts";
import { AppLayout } from "./layouts/AppLayout.tsx";

export function App() {
  const app = useTodoApp();
  const [pickerOpen, setPickerOpen] = useState(false);
  const switchButton = useRef<HTMLButtonElement>(null);
  const previousBoard = useRef(app.board.id);
  useEffect(() => {
    if (previousBoard.current !== app.board.id) {
      window.scrollTo({ top: 0, behavior: "instant" });
      previousBoard.current = app.board.id;
    }
  }, [app.board.id]);
  return (
    <AppLayout
      header={
        <BoardHeader
          name={app.board.name}
          remainingCount={app.remainingCount}
          onOpen={() => setPickerOpen(true)}
          buttonRef={switchButton}
        />
      }
      composer={
        <TaskComposer
          value={app.draft}
          onChange={app.setDraft}
          onAdd={app.addTask}
        />
      }
      feedback={<Toast notice={app.notice} onDismiss={app.dismissNotice} />}
      overlay={
        pickerOpen && (
          <BoardPicker
            boards={app.boards}
            selectedId={app.selectedBoardId}
            returnFocusRef={switchButton}
            onSelect={app.selectBoard}
            onCreate={app.createBoard}
            onRename={app.renameBoard}
            onDelete={app.deleteBoard}
            onClose={() => setPickerOpen(false)}
          />
        )
      }
    >
      <TodoList
        key={app.board.id}
        items={app.board.items}
        onToggle={app.toggleTask}
        onClear={app.clearCompleted}
      />
    </AppLayout>
  );
}

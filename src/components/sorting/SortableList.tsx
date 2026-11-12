import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { motion, reducedMotion } from "../../ui/motion.ts";
import styles from "./SortableList.module.css";

interface Entry {
  id: string;
  name: string;
}
interface Props<T extends Entry> {
  items: readonly T[];
  onMove: (id: string, targetId: string) => void;
  longPress?: boolean;
  children: (item: T, handle: ReactNode, dragging: boolean) => ReactNode;
}
function SortableEntry({
  item,
  longPress,
  children,
}: {
  item: Entry;
  longPress: boolean;
  children: (handle: ReactNode, dragging: boolean) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    transition: reducedMotion() ? null : { duration: 200, easing: motion.ease },
  });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={styles.handle}
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${item.name}`}
    >
      <span aria-hidden="true">⠿</span>
    </button>
  );
  return (
    <fieldset
      ref={setNodeRef}
      aria-label={item.name}
      onMouseDown={
        longPress
          ? (event) => {
              if (
                event.target instanceof Element &&
                !event.target.closest(
                  "button:not([data-testid=todo-title]), input, form",
                )
              )
                listeners?.onMouseDown?.(event);
            }
          : undefined
      }
      onTouchStart={
        longPress
          ? (event) => {
              if (
                event.target instanceof Element &&
                !event.target.closest(
                  "button:not([data-testid=todo-title]), input, form",
                )
              )
                listeners?.onTouchStart?.(event);
            }
          : undefined
      }
      onContextMenu={
        longPress
          ? (event) => {
              if (
                event.target instanceof Element &&
                !event.target.closest("input, form")
              )
                event.preventDefault();
            }
          : undefined
      }
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
      }}
      className={`${styles.entry} ${isDragging ? styles.dragging : ""}`}
    >
      {children(handle, isDragging)}
    </fieldset>
  );
}
export function SortableList<T extends Entry>({
  items,
  onMove,
  children,
  longPress = false,
}: Props<T>) {
  const handleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const longPressSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { delay: 400, tolerance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 400, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <DndContext
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Picked up ${items.find((item) => item.id === active.id)?.name ?? "item"}.`,
          onDragOver: ({ over }) =>
            over
              ? `Position ${items.findIndex((item) => item.id === over.id) + 1} of ${items.length}.`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `Moved ${items.find((item) => item.id === active.id)?.name ?? "item"} to position ${items.findIndex((item) => item.id === over.id) + 1}.`
              : "Reordering cancelled.",
          onDragCancel: () => "Reordering cancelled.",
        },
      }}
      sensors={longPress ? longPressSensors : handleSensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id)
          onMove(String(active.id), String(over.id));
      }}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableEntry key={item.id} item={item} longPress={longPress}>
            {(handle, dragging) => children(item, handle, dragging)}
          </SortableEntry>
        ))}
      </SortableContext>
    </DndContext>
  );
}

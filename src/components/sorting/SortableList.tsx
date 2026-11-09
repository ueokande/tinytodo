import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
  children: (item: T, handle: ReactNode) => ReactNode;
}
function SortableEntry({
  item,
  children,
}: {
  item: Entry;
  children: (handle: ReactNode) => ReactNode;
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
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
      }}
      className={`${styles.entry} ${isDragging ? styles.dragging : ""}`}
    >
      {children(handle)}
    </div>
  );
}
export function SortableList<T extends Entry>({
  items,
  onMove,
  children,
}: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
      sensors={sensors}
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
          <SortableEntry key={item.id} item={item}>
            {(handle) => children(item, handle)}
          </SortableEntry>
        ))}
      </SortableContext>
    </DndContext>
  );
}

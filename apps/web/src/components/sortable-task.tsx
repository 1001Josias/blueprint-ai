"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/schemas";
import { TaskItem } from "./task-item";

interface SortableTaskProps {
  task: Task;
  workspace: string;
  projectSlug: string;
  onClick?: () => void;
}

export function SortableTask({
  task,
  workspace,
  projectSlug,
  onClick,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem
        task={task}
        workspace={workspace}
        projectSlug={projectSlug}
        onClick={onClick}
      />
    </div>
  );
}

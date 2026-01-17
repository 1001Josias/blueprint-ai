"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/schemas";
import { SortableTask } from "./sortable-task";
import { TaskDetailModal } from "./task-detail-modal";
import { useTaskSearchParams } from "@/lib/search-params";

interface TaskListProps {
  tasks: Task[];
  workspace: string;
  projectSlug: string;
}

export function TaskList({ tasks, workspace, projectSlug }: TaskListProps) {
  const { taskId, setTaskId, filter, setFilter } = useTaskSearchParams();

  // Local state for task order - will be synced to backend in Task 2
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);

  // Sync with server data when it changes
  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const filteredTasks =
    filter === "all"
      ? orderedTasks
      : orderedTasks.filter((task) => task.status === filter);

  const selectedTask = taskId
    ? (orderedTasks.find((t) => t.id === taskId) ?? null)
    : null;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // IDs for SortableContext
  const taskIds = useMemo(
    () => filteredTasks.map((t) => t.id),
    [filteredTasks],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedTasks((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // TODO Task 2: Call API to persist new order
    }
  };

  const filters: { value: typeof filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: orderedTasks.length },
    {
      value: "todo",
      label: "To Do",
      count: orderedTasks.filter((t) => t.status === "todo").length,
    },
    {
      value: "in_progress",
      label: "In Progress",
      count: orderedTasks.filter((t) => t.status === "in_progress").length,
    },
    {
      value: "done",
      label: "Done",
      count: orderedTasks.filter((t) => t.status === "done").length,
    },
    {
      value: "blocked",
      label: "Blocked",
      count: orderedTasks.filter((t) => t.status === "blocked").length,
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              filter === f.value
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white",
            )}
          >
            {f.label}
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-black/20">
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list with DnD */}
      <DndContext
        id="task-list-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                workspace={workspace}
                projectSlug={projectSlug}
                onClick={() => setTaskId(task.id)}
              />
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p>No tasks found</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setTaskId(null)}
        workspace={workspace}
        projectSlug={projectSlug}
      />
    </div>
  );
}

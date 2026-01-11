"use client";

import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/schemas";
import { useTaskStore } from "@/lib/stores";

interface TaskItemProps {
  task: Task;
  workspace: string;
  projectSlug: string;
  onClick?: () => void;
}

const statusConfig = {
  todo: { label: "To Do", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: "○" },
  in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "◐" },
  done: { label: "Done", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "✓" },
  blocked: { label: "Blocked", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "✕" },
};

const statusOrder: TaskStatus[] = ["todo", "in_progress", "done", "blocked"];

const priorityConfig = {
  low: { label: "Low", color: "text-slate-400" },
  medium: { label: "Medium", color: "text-blue-400" },
  high: { label: "High", color: "text-orange-400" },
  critical: { label: "Critical", color: "text-red-400" },
};

export function TaskItem({ task, workspace, projectSlug, onClick }: TaskItemProps) {
  const { getStatus, setOptimisticStatus, clearOptimistic, isPending, setPending } = useTaskStore();
  const currentStatus = getStatus(task.id, task.status);
  const pending = isPending(task.id);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Clear optimistic state when server state catches up
  useEffect(() => {
    if (currentStatus === task.status && !pending) {
      clearOptimistic(task.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.status]);

  const status = statusConfig[currentStatus];
  const priority = priorityConfig[task.priority];
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const commentsCount = (task.comments?.length ?? 0) + 
    task.subtasks.reduce((acc, s) => acc + (s.comments?.length ?? 0), 0);

  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    // Optimistic update via store
    setOptimisticStatus(task.id, newStatus);
    setPending(task.id, true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace, projectSlug, status: newStatus }),
      });

      if (!response.ok) {
        clearOptimistic(task.id);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      clearOptimistic(task.id);
    } finally {
      setPending(task.id, false);
    }
  };

  return (
    <div 
      className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden cursor-pointer hover:bg-slate-800/80 hover:border-slate-600/50 transition-all duration-200"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Status icon - clickable to cycle */}
          <button
            onClick={cycleStatus}
            disabled={pending}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-200",
              "hover:scale-110 hover:ring-2 hover:ring-violet-500/50",
              pending && "opacity-50 cursor-wait",
              status.color
            )}
            title="Click to change status"
          >
            {pending ? (
              <span className="animate-spin">⟳</span>
            ) : (
              status.icon
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="text-base font-semibold text-white truncate">
                {task.title}
              </h4>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded border transition-colors",
                  status.color
                )}
              >
                {status.label}
              </span>
            </div>

            <p className="text-sm text-slate-400 line-clamp-2 mb-2">
              {task.description}
            </p>

            <div className="flex items-center gap-4 text-xs">
              <span className={cn("font-medium", priority.color)}>
                {priority.label} Priority
              </span>
              {totalSubtasks > 0 && (
                <span className="text-slate-500">
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              )}
              {commentsCount > 0 && (
                <span className="text-slate-500 flex items-center gap-1">
                  <span>💬</span> {commentsCount}
                </span>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <svg
            className="w-5 h-5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

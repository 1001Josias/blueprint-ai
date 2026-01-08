"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/schemas";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  workspace: string;
  projectSlug: string;
}

const statusConfig = {
  todo: { label: "To Do", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: "○" },
  in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "◐" },
  done: { label: "Done", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "✓" },
  blocked: { label: "Blocked", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "✕" },
};

const statusOrder: TaskStatus[] = ["todo", "in_progress", "done", "blocked"];

const priorityConfig = {
  low: { label: "Low", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  medium: { label: "Medium", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  high: { label: "High", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  critical: { label: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  workspace,
  projectSlug,
}: TaskDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [optimisticSubtasks, setOptimisticSubtasks] = useState(task?.subtasks ?? []);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync state when task changes
  useEffect(() => {
    if (task && !isPending) {
      setCurrentStatus(task.status);
      setOptimisticSubtasks(task.subtasks);
    }
  }, [task, isPending]);

  if (!task) return null;

  const status = statusConfig[currentStatus];
  const priority = priorityConfig[task.priority];
  const completedSubtasks = optimisticSubtasks.filter((s) => s.completed).length;
  const totalSubtasks = optimisticSubtasks.length;

  const cycleStatus = async () => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    setCurrentStatus(newStatus);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace, projectSlug, status: newStatus }),
      });

      if (!response.ok) {
        setCurrentStatus(task.status);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setCurrentStatus(task.status);
    }
  };

  const toggleSubtask = async (index: number) => {
    const newSubtasks = [...optimisticSubtasks];
    const newCompleted = !newSubtasks[index].completed;
    newSubtasks[index] = { ...newSubtasks[index], completed: newCompleted };

    setOptimisticSubtasks(newSubtasks);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace,
          projectSlug,
          subtaskIndex: index,
          completed: newCompleted,
        }),
      });

      if (!response.ok) {
        setOptimisticSubtasks(task.subtasks);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setOptimisticSubtasks(task.subtasks);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />

        {/* Content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-start gap-4">
              {/* Status button */}
              <button
                onClick={cycleStatus}
                disabled={isPending}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-200",
                  "hover:scale-110 hover:ring-2 hover:ring-violet-500/50",
                  isPending && "opacity-50 cursor-wait",
                  status.color
                )}
                title="Click to change status"
              >
                {isPending ? <span className="animate-spin">⟳</span> : status.icon}
              </button>

              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-white mb-2">
                  {task.title}
                </Dialog.Title>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors",
                      status.color
                    )}
                  >
                    {status.label}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-lg border",
                      priority.color
                    )}
                  >
                    {priority.label} Priority
                  </span>
                  {totalSubtasks > 0 && (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {completedSubtasks}/{totalSubtasks} subtasks
                    </span>
                  )}
                </div>
              </div>

              {/* Close button */}
              <Dialog.Close className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Description */}
            {task.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-slate-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Subtasks */}
            {optimisticSubtasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Subtasks
                </h3>
                <div className="space-y-2">
                  {optimisticSubtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        "hover:bg-slate-800/50",
                        subtask.completed
                          ? "bg-emerald-900/10 border-emerald-900/30"
                          : "bg-slate-800/30 border-slate-700/50"
                      )}
                      onClick={() => toggleSubtask(index)}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5 transition-colors",
                          subtask.completed
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-slate-700 text-slate-500 border border-slate-600"
                        )}
                      >
                        {subtask.completed ? "✓" : ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium transition-colors",
                            subtask.completed ? "text-slate-500 line-through" : "text-white"
                          )}
                        >
                          {subtask.title}
                        </p>
                        {subtask.description && (
                          <p className="text-xs text-slate-500 mt-1">{subtask.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {task.comments && task.comments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Comments ({task.comments.length})
                </h3>
                <div className="space-y-3">
                  {task.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 text-violet-400">💬</span>
                        <p className="text-sm text-slate-300">{comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!task.description && optimisticSubtasks.length === 0 && (!task.comments || task.comments.length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <p>No additional details for this task.</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

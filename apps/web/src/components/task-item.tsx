"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/schemas";

interface TaskItemProps {
  task: Task;
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
  low: { label: "Low", color: "text-slate-400" },
  medium: { label: "Medium", color: "text-blue-400" },
  high: { label: "High", color: "text-orange-400" },
  critical: { label: "Critical", color: "text-red-400" },
};

export function TaskItem({ task, workspace, projectSlug }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);
  // Optimistic state for subtasks
  const [optimisticSubtasks, setOptimisticSubtasks] = useState(task.subtasks);
  
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync optimistic state with props when they change (e.g. after refresh)
  const isValuesEqual = JSON.stringify(task.subtasks) === JSON.stringify(optimisticSubtasks);
  if (!isValuesEqual && !isPending) {
     setOptimisticSubtasks(task.subtasks);
  }

  const status = statusConfig[currentStatus];
  const priority = priorityConfig[task.priority];
  const completedSubtasks = optimisticSubtasks.filter((s) => s.completed).length;
  const totalSubtasks = optimisticSubtasks.length;

  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    // Optimistic update
    setCurrentStatus(newStatus);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace, projectSlug, status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        setCurrentStatus(task.status);
        console.error("Failed to update task status");
      } else {
        // Refresh the page data
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      // Revert on error
      setCurrentStatus(task.status);
      console.error("Error updating task status:", error);
    }
  };

  const toggleSubtask = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const newSubtasks = [...optimisticSubtasks];
    const newCompleted = !newSubtasks[index].completed;
    newSubtasks[index] = { ...newSubtasks[index], completed: newCompleted };

    // Optimistic update
    setOptimisticSubtasks(newSubtasks);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workspace,
          projectSlug, 
          subtaskIndex: index, 
          completed: newCompleted 
        }),
      });

      if (!response.ok) {
        // Revert
        setOptimisticSubtasks(task.subtasks);
        console.error("Failed to update subtask");
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
       // Revert
       setOptimisticSubtasks(task.subtasks);
       console.error("Error updating subtask:", error);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
      {/* Task header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-800/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Status icon - clickable to cycle */}
          <button
            onClick={cycleStatus}
            disabled={isPending}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-200",
              "hover:scale-110 hover:ring-2 hover:ring-violet-500/50",
              isPending && "opacity-50 cursor-wait",
              status.color
            )}
            title="Click to change status"
          >
            {isPending ? (
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

            {/* Comments for Task */}
            {task.comments && task.comments.length > 0 && (
              <div className="mt-2 space-y-1">
                {task.comments.map((comment, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                    <span className="shrink-0 mt-0.5">💬</span>
                    <span>{comment}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs mt-2">
              <span className={cn("font-medium", priority.color)}>
                {priority.label} Priority
              </span>
              {totalSubtasks > 0 && (
                <span className="text-slate-500">
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              )}
            </div>
          </div>

          {/* Expand icon */}
          {task.subtasks.length > 0 && (
            <svg
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Subtasks (expandable) */}
      {isExpanded && task.subtasks.length > 0 && (
        <div className="border-t border-slate-700/50 bg-slate-900/30">
          <div className="p-4 space-y-3">
            {optimisticSubtasks.map((subtask, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                  "hover:bg-slate-700/50",
                  subtask.completed
                     ? "bg-emerald-900/10 border-emerald-900/20" 
                     : "bg-slate-800/50 border-transparent"
                )}
                onClick={(e) => toggleSubtask(index, e)}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5 transition-colors",
                    subtask.completed
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-slate-700 text-slate-500 border border-slate-600 group-hover:border-slate-500"
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
                    <p className="text-xs text-slate-500 mt-1">
                      {subtask.description}
                    </p>
                  )}
                  {/* Comments for Subtask */}
                  {subtask.comments && subtask.comments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {subtask.comments.map((comment, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/30 p-1.5 rounded border border-slate-700/30">
                          <span className="shrink-0 mt-0.5">💬</span>
                          <span>{comment}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

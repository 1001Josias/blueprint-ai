"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/schemas";
import { useTaskStore } from "@/lib/stores";
import { MarkdownContent } from "./markdown-content";
import { CommentInput } from "./comment-input";
import { SubtaskDetailModal } from "./subtask-detail-modal";

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
  const { 
    getStatus, 
    setOptimisticStatus, 
    getSubtasks, 
    setOptimisticSubtasks, 
    clearOptimistic, 
    isPending, 
    setPending 
  } = useTaskStore();
  
  const currentStatus = task ? getStatus(task.id, task.status) : "todo";
  const optimisticSubtasks = task ? getSubtasks(task.id, task.subtasks) : [];
  const pending = task ? isPending(task.id) : false;
  
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Local state for UI interactions
  const [activeSubtaskComment, setActiveSubtaskComment] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<{ target: "task" | "subtask", index: number, subtaskIndex?: number } | null>(null);

  useEffect(() => {
    if (task && currentStatus === task.status && !pending) {
      clearOptimistic(task.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.status, task?.subtasks]);

  if (!task) return null;

  const status = statusConfig[currentStatus];
  const priority = priorityConfig[task.priority];
  const completedSubtasks = optimisticSubtasks.filter((s) => s.completed).length;
  const totalSubtasks = optimisticSubtasks.length;

  const refreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const cycleStatus = async () => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    setOptimisticStatus(task.id, newStatus);
    setPending(task.id, true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace, projectSlug, status: newStatus }),
      });

      if (!response.ok) clearOptimistic(task.id);
      else refreshData();
    } catch {
      clearOptimistic(task.id);
    } finally {
      setPending(task.id, false);
    }
  };

  const toggleSubtask = async (index: number) => {
    const newSubtasks = [...optimisticSubtasks];
    const newCompleted = !newSubtasks[index].completed;
    newSubtasks[index] = { ...newSubtasks[index], completed: newCompleted };

    setOptimisticSubtasks(task.id, newSubtasks);
    setPending(task.id, true);

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

      if (!response.ok) clearOptimistic(task.id);
      else refreshData();
    } catch {
      clearOptimistic(task.id);
    } finally {
      setPending(task.id, false);
    }
  };

  const handleCommentAction = async (
    action: "add_comment" | "edit_comment" | "delete_comment",
    text?: string,
    targetType: "task" | "subtask" = "task",
    subtaskIndex?: number,
    commentIndex?: number
  ) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace,
          projectSlug,
          action,
          text,
          commentTarget: targetType,
          subtaskIndex,
          commentIndex
        }),
      });

      if (response.ok) {
        refreshData();
        setEditingComment(null);
      }
    } catch (error) {
      console.error("Failed to update comment", error);
    }
  };

  const handleSubtaskCommentAction = async (
    subtaskIndex: number,
    action: "add_comment" | "edit_comment" | "delete_comment",
    text?: string,
    commentIndex?: number
  ) => {
    return handleCommentAction(action, text, "subtask", subtaskIndex, commentIndex);
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 p-0 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 shrink-0">
              <div className="flex items-start gap-4">
                <button
                  onClick={cycleStatus}
                  disabled={pending}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-200",
                    "hover:scale-110 hover:ring-2 hover:ring-violet-500/50",
                    pending && "opacity-50 cursor-wait",
                    status.color
                  )}
                >
                  {pending ? <span className="animate-spin">⟳</span> : status.icon}
                </button>

                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-white mb-2 leading-tight">
                    {task.title}
                  </Dialog.Title>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-lg border", status.color)}>
                      {status.label}
                    </span>
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-lg border", priority.color)}>
                      {priority.label}
                    </span>
                    {totalSubtasks > 0 && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50">
                        {completedSubtasks}/{totalSubtasks} subtasks
                      </span>
                    )}
                  </div>
                </div>

                <Dialog.Close className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Dialog.Close>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              {/* Description */}
              {task.description && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                  <MarkdownContent content={task.description} />
                </div>
              )}

              {/* Subtasks */}
              {optimisticSubtasks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Subtasks</h3>
                  <div className="space-y-3">
                    {optimisticSubtasks.map((subtask, index) => (
                      <div key={index} className="group">
                        <div className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border transition-all relative group/item",
                          subtask.completed ? "bg-emerald-900/10 border-emerald-900/30" : "bg-slate-800/30 border-slate-700/50"
                        )}>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5 cursor-pointer transition-colors",
                              subtask.completed ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-700 text-slate-500 border-slate-600 hover:border-slate-500"
                            )}
                            onClick={() => toggleSubtask(index)}
                          >
                            {subtask.completed ? "✓" : ""}
                          </div>
                          
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <p className={cn("text-sm font-medium transition-colors cursor-pointer pointer-events-auto", subtask.completed ? "text-slate-500 line-through" : "text-white")} onClick={() => toggleSubtask(index)}>
                              {subtask.title}
                            </p>
                            {subtask.description && <p className="text-xs text-slate-500 mt-1">{subtask.description}</p>}
                            
                            {/* Metadata/Summary Row */}
                            <div className="mt-2 flex items-center gap-3">
                               {/* Comments indicator / Open Modal Button */}
                               <button 
                                 onClick={() => setActiveSubtaskComment(index)}
                                 className={cn(
                                   "pointer-events-auto text-xs font-medium flex items-center gap-1.5 transition-colors px-2 py-1 rounded bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800",
                                   subtask.comments?.length ? "text-violet-400 border-violet-500/30" : "text-slate-500"
                                 )}
                               >
                                 <span className="text-[10px]">💬</span>
                                 {subtask.comments?.length || "0"}
                               </button>
                            </div>
                          </div>
                          
                          <button
                             onClick={() => setActiveSubtaskComment(index)} 
                             className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                             title="View details"
                          >
                            ↗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Task Comments */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Comments {task.comments?.length ? `(${task.comments.length})` : ""}
                </h3>
                
                <div className="space-y-4 mb-4">
                  {task.comments?.map((comment, index) => (
                    <div key={index} className="group relative p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                       {editingComment?.target === "task" && editingComment.index === index ? (
                          <CommentInput
                            initialValue={comment}
                            autoFocus
                            onSave={async (text) => handleCommentAction("edit_comment", text, "task", undefined, index)}
                            onCancel={() => setEditingComment(null)}
                          />
                       ) : (
                         <div className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs shrink-0 font-bold border border-violet-500/20">
                             AI
                           </div>
                           <div className="flex-1 min-w-0">
                             <MarkdownContent content={comment} className="text-sm text-slate-300" />
                           </div>
                           <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button 
                                onClick={() => setEditingComment({ target: "task", index })}
                                className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <span className="text-sm">✎</span>
                              </button>
                              <button 
                                onClick={() => handleCommentAction("delete_comment", undefined, "task", undefined, index)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <span className="text-xl leading-none">×</span>
                              </button>
                           </div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>

                <CommentInput
                  placeholder="Add a comment to this task..."
                  onSave={async (text) => handleCommentAction("add_comment", text, "task")}
                />
              </div>

            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Subtask Detail Modal */}
      {activeSubtaskComment !== null && optimisticSubtasks[activeSubtaskComment] && (
        <SubtaskDetailModal
          subtask={optimisticSubtasks[activeSubtaskComment]}
          isOpen={true}
          onClose={() => setActiveSubtaskComment(null)}
          onToggleComplete={() => toggleSubtask(activeSubtaskComment)}
          onCommentAction={(action, text, commentIndex) => handleSubtaskCommentAction(activeSubtaskComment, action, text, commentIndex)}
        />
      )}
    </>
  );
}


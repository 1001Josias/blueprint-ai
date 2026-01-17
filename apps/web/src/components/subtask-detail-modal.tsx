"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./markdown-content";
import { CommentInput } from "./comment-input";
import { useState } from "react";
import type { Subtask } from "@/lib/schemas";

interface SubtaskDetailModalProps {
  subtask: Subtask;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
  onCommentAction: (
    action: "add_comment" | "edit_comment" | "delete_comment",
    text?: string,
    commentIndex?: number
  ) => Promise<void>;
}

export function SubtaskDetailModal({
  subtask,
  isOpen,
  onClose,
  onToggleComplete,
  onCommentAction,
}: SubtaskDetailModalProps) {
  const [editingCommentIndex, setEditingCommentIndex] = useState<number | null>(null);

  if (!subtask) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 p-0 flex flex-col max-h-[85vh]">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50 shrink-0">
            <div className="flex items-start gap-4">
               {/* Checkbox */}
              <button
                onClick={onToggleComplete}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all duration-200 border",
                  subtask.completed
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-slate-800 text-slate-500 border-slate-600 hover:border-slate-500"
                )}
              >
                {subtask.completed ? "✓" : ""}
              </button>

              <div className="flex-1 min-w-0">
                <Dialog.Title className={cn("text-lg font-semibold mb-1 leading-tight", subtask.completed ? "text-slate-500 line-through" : "text-white")}>
                  {subtask.title}
                </Dialog.Title>
                <div className="text-xs font-medium text-slate-500">
                  Subtask details
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
            {subtask.description && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <MarkdownContent content={subtask.description} />
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Comments {subtask.comments?.length ? `(${subtask.comments.length})` : ""}
              </h3>
              
              <div className="space-y-4 mb-4">
                {subtask.comments?.map((comment, index) => (
                  <div key={index} className="group relative p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                     {editingCommentIndex === index ? (
                        <CommentInput
                          initialValue={comment}
                          autoFocus
                          onSave={async (text) => {
                            await onCommentAction("edit_comment", text, index);
                            setEditingCommentIndex(null);
                          }}
                          onCancel={() => setEditingCommentIndex(null)}
                        />
                     ) : (
                       <div className="flex items-start gap-3">
                         <div className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 text-[10px] shrink-0 font-bold border border-slate-600/50">
                           U
                         </div>
                         <div className="flex-1 min-w-0">
                           <MarkdownContent content={comment} className="text-sm text-slate-300" />
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button 
                              onClick={() => setEditingCommentIndex(index)}
                              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <span className="text-xs">✎</span>
                            </button>
                            <button 
                              onClick={() => onCommentAction("delete_comment", undefined, index)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <span className="text-lg leading-none">×</span>
                            </button>
                         </div>
                       </div>
                     )}
                  </div>
                ))}
              </div>

              <CommentInput
                placeholder="Reply to this subtask..."
                onSave={async (text) => onCommentAction("add_comment", text)}
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

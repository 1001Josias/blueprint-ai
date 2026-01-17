"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  initialValue?: string;
  placeholder?: string;
  onSave: (text: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function CommentInput({
  initialValue = "",
  placeholder = "Write a comment...",
  onSave,
  onCancel,
  autoFocus = false,
  className,
}: CommentInputProps) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [autoFocus]);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmit = async () => {
    if (!value.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(value);
      setValue("");
      if (onCancel) onCancel(); // Close input if used in "add mode" that should close
    } catch (error) {
      console.error("Failed to save comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        rows={1}
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none overflow-hidden min-h-[44px]"
      />
      
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
            value.trim() && !isSubmitting
              ? "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

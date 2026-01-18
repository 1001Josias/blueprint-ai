"use client";

import { cn } from "@/lib/utils";

interface FormattingToolbarProps {
  onInsert: (syntax: string, wrap?: boolean) => void;
  className?: string;
}

interface ToolbarButton {
  label: string;
  icon: React.ReactNode;
  syntax: string;
  wrap: boolean;
  title: string;
}

const buttons: ToolbarButton[] = [
  {
    label: "Bold",
    icon: <span className="font-bold">B</span>,
    syntax: "**",
    wrap: true,
    title: "Bold (Ctrl+B)",
  },
  {
    label: "Italic",
    icon: <span className="italic">I</span>,
    syntax: "*",
    wrap: true,
    title: "Italic (Ctrl+I)",
  },
  {
    label: "Link",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
    syntax: "[text](url)",
    wrap: false,
    title: "Insert Link",
  },
  {
    label: "Code",
    icon: <span className="font-mono text-xs">{`</>`}</span>,
    syntax: "`",
    wrap: true,
    title: "Inline Code",
  },
];

/**
 * Formatting toolbar for markdown input
 */
export function FormattingToolbar({
  onInsert,
  className,
}: FormattingToolbarProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={() => onInsert(button.syntax, button.wrap)}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg",
            "text-slate-400 hover:text-white",
            "bg-slate-800/50 hover:bg-slate-700/50",
            "border border-slate-700/50 hover:border-slate-600/50",
            "transition-all duration-150",
          )}
          title={button.title}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}

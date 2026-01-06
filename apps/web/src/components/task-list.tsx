"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/schemas";
import { TaskItem } from "./task-item";

interface TaskListProps {
  tasks: Task[];
  projectSlug: string;
}

type FilterStatus = "all" | "todo" | "in_progress" | "done" | "blocked";

export function TaskList({ tasks, projectSlug }: TaskListProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredTasks = filter === "all"
    ? tasks
    : tasks.filter((task) => task.status === filter);

  const filters: { value: FilterStatus; label: string; count: number }[] = [
    { value: "all", label: "All", count: tasks.length },
    { value: "todo", label: "To Do", count: tasks.filter((t) => t.status === "todo").length },
    { value: "in_progress", label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length },
    { value: "done", label: "Done", count: tasks.filter((t) => t.status === "done").length },
    { value: "blocked", label: "Blocked", count: tasks.filter((t) => t.status === "blocked").length },
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
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {f.label}
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-black/20">
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} projectSlug={projectSlug} />
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
    </div>
  );
}

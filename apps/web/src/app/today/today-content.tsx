"use client";

import { useEffect, useState } from "react";
import { TaskWithProject } from "@/lib/markdown";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { useTaskIdParam } from "@/lib/search-params";
import Link from "next/link";

interface TodayPageProps {
  tasks: TaskWithProject[];
}

function TodayContent({ tasks }: TodayPageProps) {
  const [selectedTaskId, setSelectedTaskId] = useTaskIdParam();
  const today = new Date().toISOString().split("T")[0];

  // Filter tasks due today
  const todayTasks = tasks.filter((task) => task.dueDate === today);

  // Group by project
  const tasksByProject = todayTasks.reduce(
    (acc, task) => {
      const key = `${task.workspace}/${task.projectSlug}`;
      if (!acc[key]) {
        acc[key] = { title: task.projectTitle, tasks: [] };
      }
      acc[key].tasks.push(task);
      return acc;
    },
    {} as Record<string, { title: string; tasks: TaskWithProject[] }>
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const priorityColors = {
    low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const statusColors = {
    todo: "bg-slate-500",
    in_progress: "bg-yellow-500",
    done: "bg-green-500",
    blocked: "bg-red-500",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Today</h1>
            <p className="text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {todayTasks.length}
          </div>
          <div className="text-sm text-amber-300">Due Today</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {todayTasks.filter((t) => t.status === "done").length}
          </div>
          <div className="text-sm text-green-300">Completed</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {todayTasks.filter((t) => t.status === "in_progress").length}
          </div>
          <div className="text-sm text-yellow-300">In Progress</div>
        </div>
      </div>

      {/* Tasks List */}
      {todayTasks.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(tasksByProject).map(([key, { title, tasks }]) => (
            <div key={key} className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                {title}
              </h2>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${statusColors[task.status]}`}
                        />
                        <span className="text-white font-medium truncate group-hover:text-violet-300 transition-colors">
                          {task.title}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border shrink-0 ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm text-slate-400 line-clamp-1 pl-5">
                        {task.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            All clear for today!
          </h3>
          <p className="text-slate-400 max-w-md mx-auto">
            No tasks are due today. Check the{" "}
            <Link href="/upcoming" className="text-violet-400 hover:underline">
              Upcoming
            </Link>{" "}
            view to see what's coming next.
          </p>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspace={selectedTask.workspace}
          projectSlug={selectedTask.projectSlug}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

export default function TodayPageWrapper({
  tasks,
}: {
  tasks: TaskWithProject[];
}) {
  return <TodayContent tasks={tasks} />;
}

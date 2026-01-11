"use client";

import { TaskWithProject } from "@/lib/markdown";
import { ProjectSummary } from "@/lib/schemas";

interface ReportsPageProps {
  tasks: TaskWithProject[];
  projects: ProjectSummary[];
}

function ReportsContent({ tasks, projects }: ReportsPageProps) {
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasks by priority
  const priorityCounts = {
    critical: tasks.filter((t) => t.priority === "critical").length,
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };

  // Tasks by workspace
  const tasksByWorkspace = tasks.reduce(
    (acc, task) => {
      if (!acc[task.workspace]) {
        acc[task.workspace] = 0;
      }
      acc[task.workspace]++;
      return acc;
    },
    {} as Record<string, number>
  );

  // Top projects by incomplete tasks
  const projectTaskCounts = tasks.reduce(
    (acc, task) => {
      if (task.status !== "done") {
        const key = `${task.workspace}/${task.projectSlug}`;
        if (!acc[key]) {
          acc[key] = { title: task.projectTitle, count: 0 };
        }
        acc[key].count++;
      }
      return acc;
    },
    {} as Record<string, { title: string; count: number }>
  );

  const topProjects = Object.entries(projectTaskCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  const statusColors = {
    done: "from-green-500 to-emerald-500",
    in_progress: "from-yellow-500 to-orange-500",
    todo: "from-slate-500 to-slate-600",
    blocked: "from-red-500 to-rose-500",
  };

  const priorityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-blue-500",
    low: "bg-slate-500",
  };

  // Calculate max for bar scaling
  const maxPriority = Math.max(...Object.values(priorityCounts));
  const maxWorkspace = Math.max(...Object.values(tasksByWorkspace));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="text-slate-400">Analytics and insights across all projects</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
          <div className="text-3xl font-bold text-white mb-1">{totalTasks}</div>
          <div className="text-sm text-violet-300">Total Tasks</div>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20">
          <div className="text-3xl font-bold text-white mb-1">{completedTasks}</div>
          <div className="text-sm text-green-300">Completed</div>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/20">
          <div className="text-3xl font-bold text-white mb-1">{inProgressTasks}</div>
          <div className="text-sm text-yellow-300">In Progress</div>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-600/20 to-slate-700/20 border border-slate-500/20">
          <div className="text-3xl font-bold text-white mb-1">{todoTasks}</div>
          <div className="text-sm text-slate-300">To Do</div>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/20">
          <div className="text-3xl font-bold text-white mb-1">{blockedTasks}</div>
          <div className="text-sm text-red-300">Blocked</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Completion Rate */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Completion Rate</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 2.51} 251`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{completionRate}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {(["done", "in_progress", "todo", "blocked"] as const).map((status) => {
                const count =
                  status === "done"
                    ? completedTasks
                    : status === "in_progress"
                      ? inProgressTasks
                      : status === "todo"
                        ? todoTasks
                        : blockedTasks;
                const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full bg-gradient-to-r ${statusColors[status]}`}
                    />
                    <span className="text-sm text-slate-400 capitalize flex-1">
                      {status.replace("_", " ")}
                    </span>
                    <span className="text-sm text-white font-medium">{count}</span>
                    <span className="text-xs text-slate-500 w-10 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Priority Distribution</h3>
          <div className="space-y-4">
            {(["critical", "high", "medium", "low"] as const).map((priority) => {
              const count = priorityCounts[priority];
              const percentage = maxPriority > 0 ? (count / maxPriority) * 100 : 0;
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 capitalize">{priority}</span>
                    <span className="text-sm text-white font-medium">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${priorityColors[priority]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Workspace */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Workspace</h3>
          {Object.keys(tasksByWorkspace).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(tasksByWorkspace)
                .sort(([, a], [, b]) => b - a)
                .map(([workspace, count]) => {
                  const percentage = maxWorkspace > 0 ? (count / maxWorkspace) * 100 : 0;
                  return (
                    <div key={workspace}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300 capitalize">{workspace}</span>
                        <span className="text-sm text-white font-medium">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No workspace data available</p>
          )}
        </div>

        {/* Top Projects by Activity */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Projects (Pending Tasks)</h3>
          {topProjects.length > 0 ? (
            <div className="space-y-3">
              {topProjects.map(([key, { title, count }], index) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-sm text-white truncate">{title}</span>
                  <span className="text-sm text-violet-400 font-medium">{count} tasks</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">All tasks are completed! 🎉</p>
          )}
        </div>
      </div>

      {/* Projects Summary */}
      <div className="mt-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Projects Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-700/30">
            <div className="text-2xl font-bold text-white mb-1">{projects.length}</div>
            <div className="text-sm text-slate-400">Total Projects</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-700/30">
            <div className="text-2xl font-bold text-white mb-1">
              {projects.filter((p) => p.status === "in_review" || p.status === "draft").length}
            </div>
            <div className="text-sm text-slate-400">Active Projects</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-700/30">
            <div className="text-2xl font-bold text-white mb-1">
              {projects.filter((p) => p.status === "approved").length}
            </div>
            <div className="text-sm text-slate-400">Completed Projects</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPageWrapper({
  tasks,
  projects,
}: {
  tasks: TaskWithProject[];
  projects: ProjectSummary[];
}) {
  return <ReportsContent tasks={tasks} projects={projects} />;
}

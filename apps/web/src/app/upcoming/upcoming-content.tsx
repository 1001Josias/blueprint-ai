"use client";

import { TaskWithProject } from "@/lib/markdown";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { useTaskIdParam } from "@/lib/search-params";
import Link from "next/link";

interface UpcomingPageProps {
  tasks: TaskWithProject[];
}

function UpcomingContent({ tasks }: UpcomingPageProps) {
  const [selectedTaskId, setSelectedTaskId] = useTaskIdParam();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Filter and categorize tasks
  const upcomingTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today && dueDate <= nextWeek;
  });

  const todayTasks = upcomingTasks.filter((task) => {
    const dueDate = new Date(task.dueDate!);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  const tomorrowTasks = upcomingTasks.filter((task) => {
    const dueDate = new Date(task.dueDate!);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === tomorrow.getTime();
  });

  const laterTasks = upcomingTasks.filter((task) => {
    const dueDate = new Date(task.dueDate!);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > tomorrow;
  });

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

  const TaskSection = ({
    title,
    tasks,
    emptyMessage,
    accentColor = "violet",
  }: {
    title: string;
    tasks: TaskWithProject[];
    emptyMessage: string;
    accentColor?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="px-2 py-0.5 text-xs bg-slate-700 rounded-full text-slate-300">
          {tasks.length}
        </span>
      </div>
      {tasks.length > 0 ? (
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
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{task.projectTitle}</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full border ${priorityColors[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Upcoming</h1>
            <p className="text-slate-400">Tasks scheduled for the next 7 days</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {upcomingTasks.length}
          </div>
          <div className="text-sm text-cyan-300">Total Upcoming</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {todayTasks.length}
          </div>
          <div className="text-sm text-amber-300">Due Today</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {tomorrowTasks.length}
          </div>
          <div className="text-sm text-violet-300">Due Tomorrow</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-600/20 to-slate-700/20 border border-slate-500/20">
          <div className="text-2xl font-bold text-white mb-1">
            {laterTasks.length}
          </div>
          <div className="text-sm text-slate-300">This Week</div>
        </div>
      </div>

      {/* Task Sections */}
      {upcomingTasks.length > 0 ? (
        <div className="space-y-8">
          {todayTasks.length > 0 && (
            <TaskSection
              title="Today"
              tasks={todayTasks}
              emptyMessage="No tasks due today"
            />
          )}
          {tomorrowTasks.length > 0 && (
            <TaskSection
              title="Tomorrow"
              tasks={tomorrowTasks}
              emptyMessage="No tasks due tomorrow"
            />
          )}
          {laterTasks.length > 0 && (
            <TaskSection
              title="This Week"
              tasks={laterTasks}
              emptyMessage="No tasks this week"
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 px-8 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No upcoming tasks
          </h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Tasks with due dates in the next 7 days will appear here. Add{" "}
            <code className="px-1.5 py-0.5 bg-slate-700 rounded text-violet-300">
              - **due_date:** YYYY-MM-DD
            </code>{" "}
            to your task definitions.
          </p>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspace={selectedTask.workspace}
          projectSlug={selectedTask.projectSlug}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

export default function UpcomingPageWrapper({
  tasks,
}: {
  tasks: TaskWithProject[];
}) {
  return <UpcomingContent tasks={tasks} />;
}

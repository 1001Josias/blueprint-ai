"use client";

import { useState } from "react";
import { TaskWithProject } from "@/lib/markdown";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { useTaskIdParam } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface CalendarPageProps {
  tasks: TaskWithProject[];
}

function CalendarContent({ tasks }: CalendarPageProps) {
  const [selectedTaskId, setSelectedTaskId] = useTaskIdParam();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar data
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Create calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Tasks by date
  const tasksByDate = tasks.reduce(
    (acc, task) => {
      if (task.dueDate) {
        if (!acc[task.dueDate]) {
          acc[task.dueDate] = [];
        }
        acc[task.dueDate].push(task);
      }
      return acc;
    },
    {} as Record<string, TaskWithProject[]>
  );

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const selectedDateTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const priorityColors = {
    low: "bg-slate-500",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  const statusColors = {
    todo: "bg-slate-500",
    in_progress: "bg-yellow-500",
    done: "bg-green-500",
    blocked: "bg-red-500",
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDate(null);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
            <h1 className="text-3xl font-bold text-white">Calendar</h1>
            <p className="text-slate-400">Visual overview of task due dates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-white">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-700/50">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-medium text-slate-500 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="p-3 min-h-[80px] border-b border-r border-slate-700/30"
                    />
                  );
                }

                const dateStr = getDateString(day);
                const dayTasks = tasksByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "p-3 min-h-[80px] border-b border-r border-slate-700/30 text-left transition-all hover:bg-slate-700/30",
                      isSelected && "bg-violet-500/20 ring-1 ring-violet-500/50",
                      isToday(day) && !isSelected && "bg-slate-700/30"
                    )}
                  >
                    <div
                      className={cn(
                        "text-sm font-medium mb-1",
                        isToday(day) ? "text-violet-400" : "text-slate-300"
                      )}
                    >
                      {day}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              priorityColors[task.priority]
                            )}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{dayTasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              Low
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Medium
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              High
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Critical
            </span>
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="font-semibold text-white">
                {selectedDate
                  ? new Date(selectedDate + "T12:00:00").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "Select a date"}
              </h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {selectedDate ? (
                selectedDateTasks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="w-full text-left p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              statusColors[task.status]
                            )}
                          />
                          <span className="text-sm font-medium text-white truncate group-hover:text-violet-300">
                            {task.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate pl-4">
                          {task.projectTitle}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No tasks due on this date
                  </p>
                )
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  Click a date to see tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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

export default function CalendarPageWrapper({
  tasks,
}: {
  tasks: TaskWithProject[];
}) {
  return <CalendarContent tasks={tasks} />;
}

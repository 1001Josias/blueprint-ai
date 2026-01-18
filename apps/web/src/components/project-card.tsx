import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/lib/schemas";

interface ProjectCardProps {
  project: ProjectSummary;
}

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  in_review: {
    label: "In Review",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  approved: {
    label: "Approved",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const progress =
    project.taskStats.total > 0
      ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
      : 0;

  const status = statusConfig[project.status];

  return (
    <Link
      href={`/projects/${project.workspace}/${project.slug}`}
      className="group block p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-800/80 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
            {project.title}
          </h3>
        </div>
        <span
          className={cn(
            "ml-3 px-2.5 py-1 text-xs font-medium rounded-full border",
            status.color,
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium text-white">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <div className="text-lg font-bold text-green-400">
            {project.taskStats.done}
          </div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <div className="text-lg font-bold text-yellow-400">
            {project.taskStats.inProgress}
          </div>
          <div className="text-xs text-slate-500">In Progress</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <div className="text-lg font-bold text-slate-400">
            {project.taskStats.todo}
          </div>
          <div className="text-xs text-slate-500">To Do</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <div className="text-lg font-bold text-red-400">
            {project.taskStats.blocked}
          </div>
          <div className="text-xs text-slate-500">Blocked</div>
        </div>
      </div>

      {/* Hover arrow */}
      <div className="mt-4 flex items-center justify-end text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm mr-1">View Project</span>
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

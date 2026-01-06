"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/lib/schemas";

interface SidebarProps {
  projects: ProjectSummary[];
}

const statusColors = {
  draft: "bg-gray-500",
  in_review: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

export function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">BlueprintAI</h1>
            <p className="text-xs text-slate-400">Task Manager</p>
          </div>
        </Link>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
          Projects
        </h2>
        <nav className="space-y-1">
          {projects.map((project) => {
            const isActive = pathname === `/projects/${project.slug}`;
            const progress = project.taskStats.total > 0
              ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
              : 0;

            return (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className={cn(
                  "block p-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "hover:bg-slate-800/50 border border-transparent"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white truncate">
                    {project.title}
                  </span>
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      statusColors[project.status]
                    )}
                  />
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>{project.taskStats.done}/{project.taskStats.total} tasks</span>
                  <span>{progress}%</span>
                </div>
              </Link>
            );
          })}

          {projects.length === 0 && (
            <p className="text-sm text-slate-500 px-2 py-4 text-center">
              No projects yet
            </p>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">
          Powered by AI Agents
        </p>
      </div>
    </aside>
  );
}

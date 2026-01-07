"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

// Map typical workspaces to icons/colors (or generate based on name)
const getWorkspaceColor = (workspace: string) => {
  const hash = workspace.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = [
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-green-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
  ];
  return colors[hash % colors.length];
};

export function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  // Filter projects by status (active = draft/in_review, archived = approved/rejected)
  const filteredProjects = projects.filter((project) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return project.status === "draft" || project.status === "in_review";
    return project.status === "approved" || project.status === "rejected";
  });

  // Group projects by workspace
  const projectsByWorkspace = filteredProjects.reduce((acc, project) => {
    if (!acc[project.workspace]) {
      acc[project.workspace] = [];
    }
    acc[project.workspace].push(project);
    return acc;
  }, {} as Record<string, ProjectSummary[]>);

  const toggleWorkspace = (workspace: string) => {
    setCollapsedWorkspaces((prev) => ({
      ...prev,
      [workspace]: !prev[workspace],
    }));
  };

  return (
    <aside className="w-72 h-screen bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-105">
             <Image 
              src="/logo.svg" 
              alt="BlueprintAI Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">BlueprintAI</h1>
            <p className="text-xs text-slate-400 font-medium">Task Manager</p>
          </div>
        </Link>
      </div>

      {/* Status Filters */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex gap-2">
          {(["all", "active", "archived"] as const).map((filter) => {
            const count = filter === "all" 
              ? projects.length 
              : filter === "active"
                ? projects.filter(p => p.status === "draft" || p.status === "in_review").length
                : projects.filter(p => p.status === "approved" || p.status === "rejected").length;
            
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                  statusFilter === filter
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <span className="capitalize">{filter}</span>
                <span className={cn(
                  "px-1.5 py-0.5 text-[10px] rounded-md tabular-nums",
                  statusFilter === filter 
                    ? "bg-violet-500/30 text-violet-200" 
                    : "bg-slate-800 text-slate-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {Object.entries(projectsByWorkspace).map(([workspace, workspaceProjects]) => {
          const isCollapsed = collapsedWorkspaces[workspace];
          const isActive = workspaceProjects.some(p => pathname === `/projects/${p.workspace}/${p.slug}`);
          
          return (
            <div 
              key={workspace} 
              className={cn(
                "rounded-xl border transition-all duration-300 overflow-hidden",
                "bg-slate-900/30 border-slate-800/50",
                isActive ? "ring-1 ring-slate-700 shadow-lg shadow-black/20" : "hover:border-slate-700"
              )}
            >
              {/* Workspace Header */}
              <button
                onClick={() => toggleWorkspace(workspace)}
                className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center bg-linear-to-br shadow-inner",
                    getWorkspaceColor(workspace)
                  )}>
                    <span className="text-white text-xs font-bold uppercase">
                      {workspace.substring(0, 2)}
                    </span>
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-semibold text-slate-200 capitalize tracking-wide group-hover:text-white transition-colors">
                      {workspace}
                    </h2>
                    <span className="text-[10px] text-slate-500">{workspaceProjects.length} projects</span>
                  </div>
                </div>
                
                <svg
                  className={cn(
                    "w-4 h-4 text-slate-500 transition-transform duration-300",
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Workspace Projects (Collapsible) */}
              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                )}
              >
                <div className="overflow-hidden">
                  <nav className="p-2 pt-0 space-y-1">
                    {workspaceProjects.map((project) => {
                      const isProjectActive = pathname === `/projects/${project.workspace}/${project.slug}`;
                      const progress = project.taskStats.total > 0
                        ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
                        : 0;

                      return (
                        <Link
                          key={`${project.workspace}-${project.slug}`}
                          href={`/projects/${project.workspace}/${project.slug}`}
                          className={cn(
                            "group block p-2.5 rounded-lg transition-all duration-200 relative overflow-hidden",
                            isProjectActive
                              ? "bg-slate-800 text-white shadow-md shadow-black/10"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          )}
                        >
                          {isProjectActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                          )}
                          
                          <div className="flex items-center justify-between gap-2 mb-1.5 pl-2">
                            <span className="text-sm font-medium truncate">
                              {project.title}
                            </span>
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                statusColors[project.status]
                              )}
                            />
                          </div>
                          
                          {/* Mini Progress bar */}
                          <div className="pl-2 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="flex-1 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isProjectActive ? "bg-violet-500" : "bg-slate-500"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums">
                              {progress}%
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
               <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No projects found</p>
            <p className="text-xs text-slate-500 mt-1">Check your filters or create one.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                AI
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">AI Agent</p>
                <p className="text-xs text-slate-500 truncate">Online</p>
            </div>
        </div>
      </div>
    </aside>
  );
}

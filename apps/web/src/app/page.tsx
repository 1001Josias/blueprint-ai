import { getAllProjects } from "@/lib/markdown";
import { ProjectCard } from "@/components/project-card";

import { headers } from "next/headers";

export default async function Home() {
  const headersList = await headers();
  const workspace = headersList.get("x-workspace") || undefined;
  const projects = await getAllProjects(workspace);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">
          Overview of all your AI-generated projects and tasks
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-xl bg-linear-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
          <div className="text-3xl font-bold text-white mb-1">
            {projects.length}
          </div>
          <div className="text-sm text-violet-300">Total Projects</div>
        </div>
        <div className="p-6 rounded-xl bg-linear-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20">
          <div className="text-3xl font-bold text-white mb-1">
            {projects.reduce((acc, p) => acc + p.taskStats.done, 0)}
          </div>
          <div className="text-sm text-green-300">Tasks Completed</div>
        </div>
        <div className="p-6 rounded-xl bg-linear-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/20">
          <div className="text-3xl font-bold text-white mb-1">
            {projects.reduce((acc, p) => acc + p.taskStats.inProgress, 0)}
          </div>
          <div className="text-sm text-yellow-300">In Progress</div>
        </div>
        <div className="p-6 rounded-xl bg-linear-to-br from-slate-600/20 to-slate-700/20 border border-slate-500/20">
          <div className="text-3xl font-bold text-white mb-1">
            {projects.reduce((acc, p) => acc + p.taskStats.todo, 0)}
          </div>
          <div className="text-sm text-slate-300">To Do</div>
        </div>
      </div>

      {/* Projects grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Projects</h2>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No projects yet
          </h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Create a new project by adding a PRD and tasks markdown file in the{" "}
            <code className="px-1.5 py-0.5 bg-slate-700 rounded text-violet-300">
              projects/
            </code>{" "}
            directory.
          </p>
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProject, getAllProjectPaths } from "@/lib/markdown";
import { TaskList } from "@/components/task-list";

interface ProjectPageProps {
  params: Promise<{ workspace: string; slug: string }>;
}

export async function generateStaticParams() {
  const paths = getAllProjectPaths();
  return paths;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { workspace, slug } = await params;
  const project = await getProject(workspace, slug);

  if (!project) {
    notFound();
  }

  const { prd, tasks } = project;
  const completedTasks = tasks.items.filter((t) => t.status === "done").length;
  const progress =
    tasks.items.length > 0
      ? Math.round((completedTasks / tasks.items.length) * 100)
      : 0;

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

  const status = statusConfig[prd.frontmatter.status];

  return (
    <div className="p-8">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-white">
            {prd.frontmatter.title}
          </h1>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full border ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="max-w-xl">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-white font-medium">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PRD Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
              <div className="p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-violet-400"
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
                  PRD
                </h2>
              </div>
              <div
                className="p-4 prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: prd.htmlContent }}
              />
            </div>

            {/* Metadata */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Metadata
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Version</dt>
                  <dd className="text-slate-300">{prd.frontmatter.version}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Author</dt>
                  <dd className="text-slate-300">
                    {prd.frontmatter.author || "Unknown"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-300">
                    {prd.frontmatter.created_at}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Updated</dt>
                  <dd className="text-slate-300">
                    {prd.frontmatter.updated_at}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              Tasks
              <span className="px-2 py-0.5 text-xs bg-slate-700 rounded-full text-slate-300">
                {tasks.items.length}
              </span>
            </h2>
          </div>

          <Suspense
            fallback={<div className="text-slate-500">Loading tasks...</div>}
          >
            <TaskList
              tasks={tasks.items}
              workspace={workspace}
              projectSlug={slug}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

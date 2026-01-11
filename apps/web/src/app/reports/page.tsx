import { getAllTasksWithProject } from "@/lib/markdown";
import { getAllProjects } from "@/lib/markdown";
import ReportsPageWrapper from "./reports-content";

export default async function ReportsPage() {
  const [tasks, projects] = await Promise.all([
    getAllTasksWithProject(),
    getAllProjects(),
  ]);

  return <ReportsPageWrapper tasks={tasks} projects={projects} />;
}

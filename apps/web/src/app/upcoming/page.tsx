import { getAllTasksWithProject } from "@/lib/markdown";
import UpcomingPageWrapper from "./upcoming-content";

export default async function UpcomingPage() {
  const tasks = await getAllTasksWithProject();

  return <UpcomingPageWrapper tasks={tasks} />;
}

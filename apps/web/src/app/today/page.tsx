import { getAllTasksWithProject } from "@/lib/markdown";
import TodayPageWrapper from "./today-content";

export default async function TodayPage() {
  const tasks = await getAllTasksWithProject();

  return <TodayPageWrapper tasks={tasks} />;
}

import { getAllTasksWithProject } from "@/lib/markdown";
import CalendarPageWrapper from "./calendar-content";

export default async function CalendarPage() {
  const tasks = await getAllTasksWithProject();

  return <CalendarPageWrapper tasks={tasks} />;
}

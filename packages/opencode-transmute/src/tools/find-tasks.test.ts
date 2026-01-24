import { describe, it, expect, vi, beforeEach } from "vitest";
import { findTasks } from "./find-tasks";
import * as tasksCore from "../core/tasks";
import * as execCore from "../core/exec";

vi.mock("../core/tasks");
vi.mock("../core/exec");

describe("findTasks Tool", () => {
    
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(execCore.getGitRoot).mockResolvedValue("/repo/root");
    });
    
    it("should fail if no projects found", async () => {
        vi.mocked(tasksCore.findProjectPaths).mockResolvedValue([]);
        await expect(findTasks({})).rejects.toThrow("No projects found");
    });
    
    it("should use fallback to find project by taskId if multiple projects", async () => {
         vi.mocked(tasksCore.findProjectPaths).mockResolvedValue(["/repo/root/p1", "/repo/root/p2"]);
         vi.mocked(tasksCore.getProjectTasks).mockImplementation(async (path) => {
             if (path === "/repo/root/p2") {
                 return [{ id: "task-123", title: "My Task", status: "todo", priority: "medium", description: "" }];
             }
             return [];
         });

         const result = await findTasks({ taskId: "task-123" });
         
         expect(result.projectPath).toBe("/repo/root/p2");
         expect(result.tasks).toHaveLength(1);
         expect(result.tasks[0].id).toBe("task-123");
    });

    it("should default to first project if multiple found and no ambiguous overlap", async () => {
        vi.mocked(tasksCore.findProjectPaths).mockResolvedValue(["/repo/root/p1", "/repo/root/p2"]);
        vi.mocked(tasksCore.getProjectTasks).mockResolvedValue([
            { id: "t1", title: "Task 1", status: "todo", priority: "medium", description: "" }
        ]);

        const result = await findTasks({});
        expect(result.projectPath).toBe("/repo/root/p1");
        expect(result.tasks).toHaveLength(1);
    });

    it("should filter by status", async () => {
        vi.mocked(tasksCore.findProjectPaths).mockResolvedValue(["/repo/root/p1"]);
        vi.mocked(tasksCore.getProjectTasks).mockResolvedValue([
            { id: "t1", title: "Done Task", status: "done", priority: "low", description: "" },
            { id: "t2", title: "Todo Task", status: "todo", priority: "high", description: "" }
        ]);

        const result = await findTasks({ status: "todo" });
        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].id).toBe("t2");
    });
});

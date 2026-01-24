import { describe, it, expect, vi } from "vitest";
import { parseTasks, getProjectTasks } from "./tasks";
import fs from "fs/promises";

vi.mock("fs/promises");

describe("tasks", () => {
  describe("parseTasks", () => {
    it("should parse a valid tasks.md content", () => {
      const content = `
# Tasks: Project Title

## Task 1: Setup Project
- **id:** task-001
- **status:** done
- **priority:** critical
- **description:** Initial setup
- **comment:** Some comment

## Task 2: Implement Feature
- **id:** task-002
- **status:** todo
- **priority:** high
- **description:** Implement the feature
      `;

      const tasks = parseTasks(content);

      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toEqual({
        id: "task-001",
        title: "Setup Project",
        status: "done",
        priority: "critical",
        description: "Initial setup",
      });
      expect(tasks[1]).toEqual({
        id: "task-002",
        title: "Implement Feature",
        status: "todo",
        priority: "high",
        description: "Implement the feature",
      });
    });

    it("should handle missing optional fields", () => {
      const content = `
## Task: Simple Task
- **id:** task-003
      `;

      const tasks = parseTasks(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        id: "task-003",
        title: "Simple Task",
        status: "todo", // default
        priority: "medium", // default
        description: "",
      });
    });

    it("should ignore invalid tasks or lines", () => {
      const content = `
# Just a header
Some random text

## Task 1: Good Task
- **id:** task-1
      `;
      const tasks = parseTasks(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("task-1");
    });
  });

  describe("getProjectTasks", () => {
    it("should read file and parse tasks", async () => {
      vi.spyOn(fs, "readFile").mockResolvedValueOnce(`
## Task 1: A
- **id:** 1
      `);

      const tasks = await getProjectTasks("/path/to/project");
      expect(fs.readFile).toHaveBeenCalledWith("/path/to/project/tasks.md", "utf-8");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("A");
    });

    it("should throw error if file not found", async () => {
        const error = new Error("ENOENT");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).code = "ENOENT";
        vi.spyOn(fs, "readFile").mockRejectedValueOnce(error);
        
        await expect(getProjectTasks("/path/to/project")).rejects.toThrow("tasks.md not found");
    });
  });
});

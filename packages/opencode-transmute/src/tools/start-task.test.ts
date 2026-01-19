/**
 * Tests for Start Task Tool
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  startTask,
  resumeTask,
  startTaskInputSchema,
  startTaskOutputSchema,
  type StartTaskInput,
} from "./start-task";
import { exec } from "../core/exec";
import { loadState, addSession, type Session } from "../core/session";
import type { TerminalAdapter } from "../adapters/terminal/types";

// Helper to create a git repository for testing
async function createTestRepo(): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "start-task-test-"));

  // Initialize git repo
  await exec("git", ["init"], { cwd: tempDir });
  await exec("git", ["config", "user.email", "test@test.com"], {
    cwd: tempDir,
  });
  await exec("git", ["config", "user.name", "Test User"], { cwd: tempDir });

  // Create initial commit on main branch
  await writeFile(join(tempDir, "README.md"), "# Test Repo");
  await exec("git", ["add", "."], { cwd: tempDir });
  await exec("git", ["commit", "-m", "Initial commit"], { cwd: tempDir });

  // Ensure we're on main branch
  await exec("git", ["branch", "-M", "main"], { cwd: tempDir });

  return tempDir;
}

// Mock terminal adapter
function createMockTerminal(available = true): TerminalAdapter {
  return {
    name: "mock-terminal",
    isAvailable: vi.fn().mockResolvedValue(available),
    openSession: vi.fn().mockResolvedValue(undefined),
  };
}

describe("startTaskInputSchema", () => {
  it("should validate valid input", () => {
    const input = {
      taskId: "task-123",
      title: "Implement feature",
    };
    const result = startTaskInputSchema.parse(input);
    expect(result.taskId).toBe("task-123");
    expect(result.title).toBe("Implement feature");
  });

  it("should validate input with all optional fields", () => {
    const input = {
      taskId: "task-123",
      title: "Implement feature",
      description: "Add new feature",
      priority: "high",
      type: "feat",
      baseBranch: "develop",
    };
    const result = startTaskInputSchema.parse(input);
    expect(result.description).toBe("Add new feature");
    expect(result.priority).toBe("high");
    expect(result.type).toBe("feat");
    expect(result.baseBranch).toBe("develop");
  });

  it("should reject empty taskId", () => {
    expect(() =>
      startTaskInputSchema.parse({ taskId: "", title: "Test" }),
    ).toThrow();
  });

  it("should reject empty title", () => {
    expect(() =>
      startTaskInputSchema.parse({ taskId: "task-1", title: "" }),
    ).toThrow();
  });
});

describe("startTaskOutputSchema", () => {
  it("should validate created status output", () => {
    const output = {
      status: "created",
      branch: "feat/test",
      worktreePath: "/path/to/worktree",
      taskId: "task-123",
      taskName: "Test Task",
      opencodeSessionId: "session-abc",
    };
    const result = startTaskOutputSchema.parse(output);
    expect(result.status).toBe("created");
  });

  it("should validate existing status output", () => {
    const output = {
      status: "existing",
      branch: "feat/test",
      worktreePath: "/path/to/worktree",
      taskId: "task-123",
      taskName: "Test Task",
    };
    const result = startTaskOutputSchema.parse(output);
    expect(result.status).toBe("existing");
  });
});

describe("startTask", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTestRepo();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("creating new task", () => {
    it("should create worktree and session for new task", async () => {
      const input: StartTaskInput = {
        taskId: "task-001",
        title: "Add login feature",
      };

      const result = await startTask(input, tempDir, {
        opencodeSessionId: "session-123",
        openTerminal: false,
        runHooks: false,
      });

      expect(result.status).toBe("created");
      expect(result.taskId).toBe("task-001");
      expect(result.taskName).toBe("Add login feature");
      expect(result.branch).toMatch(/^feat\//);
      expect(result.worktreePath).toContain("worktrees");
      expect(result.opencodeSessionId).toBe("session-123");

      // Verify session was saved
      const state = await loadState(tempDir);
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].taskId).toBe("task-001");
      expect(state.sessions[0].opencodeSessionId).toBe("session-123");
    });

    it("should use provided branch type hint", async () => {
      const input: StartTaskInput = {
        taskId: "task-002",
        title: "Fix broken button",
        type: "fix",
      };

      const result = await startTask(input, tempDir, {
        opencodeSessionId: "session-456",
        openTerminal: false,
        runHooks: false,
      });

      expect(result.branch).toMatch(/^fix\//);
    });

    it("should require opencodeSessionId for new tasks", async () => {
      const input: StartTaskInput = {
        taskId: "task-003",
        title: "Some task",
      };

      const result = await startTask(input, tempDir, {
        openTerminal: false,
        runHooks: false,
      });

      expect(result.status).toBe("failed");
      expect(result.message).toContain("opencodeSessionId is required");
    });

    it("should execute hooks when runHooks is true", async () => {
      const input: StartTaskInput = {
        taskId: "task-004",
        title: "Task with hooks",
      };

      const result = await startTask(input, tempDir, {
        opencodeSessionId: "session-789",
        openTerminal: false,
        runHooks: true,
        hooks: {
          afterCreate: ["touch hook-executed.txt"],
        },
      });

      // Check that hook was executed
      const { stat } = await import("node:fs/promises");
      const hookFileExists = await stat(
        join(result.worktreePath!, "hook-executed.txt"),
      )
        .then(() => true)
        .catch(() => false);

      expect(hookFileExists).toBe(true);
    });

    it("should open terminal when terminal adapter is provided", async () => {
      const mockTerminal = createMockTerminal();

      const input: StartTaskInput = {
        taskId: "task-005",
        title: "Task with terminal",
      };

      await startTask(input, tempDir, {
        opencodeSessionId: "session-term",
        terminal: mockTerminal,
        openTerminal: true,
        runHooks: false,
      });

      expect(mockTerminal.isAvailable).toHaveBeenCalled();
      expect(mockTerminal.openSession).toHaveBeenCalledWith(
        expect.objectContaining({
          cwd: expect.stringContaining("worktrees"),
          title: expect.stringContaining("Task with terminal"),
          // Each worktree gets a fresh OpenCode session (no --session flag)
          commands: expect.arrayContaining(["opencode"]),
        }),
      );
    });

    it("should not open terminal when openTerminal is false", async () => {
      const mockTerminal = createMockTerminal();

      const input: StartTaskInput = {
        taskId: "task-006",
        title: "Task without terminal",
      };

      await startTask(input, tempDir, {
        opencodeSessionId: "session-no-term",
        terminal: mockTerminal,
        openTerminal: false,
        runHooks: false,
      });

      expect(mockTerminal.openSession).not.toHaveBeenCalled();
    });
  });

  describe("resuming existing task", () => {
    it("should return existing session without creating new worktree", async () => {
      // First, create a task
      const input: StartTaskInput = {
        taskId: "task-existing",
        title: "Existing task",
      };

      const firstResult = await startTask(input, tempDir, {
        opencodeSessionId: "session-existing",
        openTerminal: false,
        runHooks: false,
      });

      expect(firstResult.status).toBe("created");

      // Now try to start the same task again
      const secondResult = await startTask(input, tempDir, {
        opencodeSessionId: "session-new", // Different session ID
        openTerminal: false,
        runHooks: false,
      });

      expect(secondResult.status).toBe("existing");
      expect(secondResult.branch).toBe(firstResult.branch);
      expect(secondResult.worktreePath).toBe(firstResult.worktreePath);
      // Should return the original session ID
      expect(secondResult.opencodeSessionId).toBe("session-existing");

      // Verify only one session exists
      const state = await loadState(tempDir);
      expect(state.sessions).toHaveLength(1);
    });

    it("should open terminal for existing session", async () => {
      const mockTerminal = createMockTerminal();

      // Create initial task
      const input: StartTaskInput = {
        taskId: "task-resume",
        title: "Resume task",
      };

      await startTask(input, tempDir, {
        opencodeSessionId: "session-resume",
        openTerminal: false,
        runHooks: false,
      });

      // Resume the task
      await startTask(input, tempDir, {
        opencodeSessionId: "session-resume",
        terminal: mockTerminal,
        openTerminal: true,
        runHooks: false,
      });

      expect(mockTerminal.openSession).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle unavailable terminal gracefully", async () => {
      const mockTerminal = createMockTerminal(false); // Not available

      const input: StartTaskInput = {
        taskId: "task-no-term",
        title: "Task with unavailable terminal",
      };

      // Should not throw
      const result = await startTask(input, tempDir, {
        opencodeSessionId: "session-no-term",
        terminal: mockTerminal,
        openTerminal: true,
        runHooks: false,
      });

      expect(result.status).toBe("created");
      expect(mockTerminal.isAvailable).toHaveBeenCalled();
      expect(mockTerminal.openSession).not.toHaveBeenCalled();
    });

    it("should continue if hooks fail", async () => {
      const input: StartTaskInput = {
        taskId: "task-hook-fail",
        title: "Task with failing hooks",
      };

      // Should not throw even if hook fails
      const result = await startTask(input, tempDir, {
        opencodeSessionId: "session-hook-fail",
        openTerminal: false,
        runHooks: true,
        hooks: {
          afterCreate: ["exit 1"], // This will fail
        },
      });

      expect(result.status).toBe("created");
    });
  });
});

describe("resumeTask", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTestRepo();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should return session and open terminal", async () => {
    // Create a session first
    const session: Session = {
      taskId: "task-resume-test",
      taskName: "Resume Test",
      branch: "feat/resume-test",
      worktreePath: join(tempDir, "worktrees", "feat-resume-test"),
      createdAt: new Date().toISOString(),
      opencodeSessionId: "session-resume-test",
    };

    await mkdir(join(tempDir, ".opencode"), { recursive: true });
    await addSession(tempDir, session);

    const mockTerminal = createMockTerminal();

    const result = await resumeTask("task-resume-test", tempDir, {
      terminal: mockTerminal,
    });

    expect(result).toBeDefined();
    expect(result?.taskId).toBe("task-resume-test");
    expect(mockTerminal.openSession).toHaveBeenCalled();
  });

  it("should return undefined for non-existent task", async () => {
    const result = await resumeTask("non-existent", tempDir);
    expect(result).toBeUndefined();
  });

  it("should work without terminal", async () => {
    // Create a session first
    const session: Session = {
      taskId: "task-no-term",
      taskName: "No Terminal",
      branch: "feat/no-term",
      worktreePath: join(tempDir, "worktrees", "feat-no-term"),
      createdAt: new Date().toISOString(),
      opencodeSessionId: "session-no-term",
    };

    await mkdir(join(tempDir, ".opencode"), { recursive: true });
    await addSession(tempDir, session);

    const result = await resumeTask("task-no-term", tempDir);

    expect(result).toBeDefined();
    expect(result?.taskId).toBe("task-no-term");
  });
});

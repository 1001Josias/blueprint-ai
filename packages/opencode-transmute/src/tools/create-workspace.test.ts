/**
 * Tests for create-workspace tool
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorkspace, createWorkspaceInputSchema } from "./create-workspace";
import * as naming from "../core/naming";
import * as worktree from "../core/worktree";
import * as session from "../core/session";
import * as hooks from "../core/hooks";
import * as exec from "../core/exec";
import type { TerminalAdapter } from "../adapters/terminal/types";

// Mock dependencies
vi.mock("../core/naming", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core/naming")>();
  return {
    ...actual,
    generateBranchName: vi.fn(),
  };
});
vi.mock("../core/worktree");
vi.mock("../core/session");
vi.mock("../core/hooks");
vi.mock("../core/exec");

describe("createWorkspace tool", () => {
  const mockRepoRoot = "/path/to/repo";
  const mockTerminal: TerminalAdapter = {
    name: "mock-term",
    isAvailable: vi.fn().mockResolvedValue(true),
    openSession: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(exec.getGitRoot).mockResolvedValue(mockRepoRoot);
    mockTerminal.isAvailable = vi.fn().mockResolvedValue(true);
    mockTerminal.openSession = vi.fn().mockResolvedValue(undefined);
  });

  describe("input schema", () => {
    it("should validate valid input", () => {
      const input = {
        taskId: "task-123",
        title: "Test Task",
      };
      expect(createWorkspaceInputSchema.parse(input)).toEqual(input);
    });

    it("should validate input with slug", () => {
        const input = {
          taskId: "task-123",
          title: "Test Task",
          slug: "test-task-slug",
          type: "fix"
        };
        expect(createWorkspaceInputSchema.parse(input)).toEqual(input);
      });
  });

  describe("createWorkspace", () => {
    it("should return existing session if found", async () => {
      const existingSession = {
        taskId: "task-123",
        taskName: "Existing Task",
        branch: "feat/existing",
        worktreePath: "/path/to/worktrees/feat/existing",
        createdAt: new Date().toISOString(),
        opencodeSessionId: "session-123",
      };

      vi.mocked(session.findSessionByTask).mockResolvedValue(existingSession);

      const result = await createWorkspace(
        { taskId: "task-123", title: "New Title" }, // Title ignored if existing
        mockRepoRoot,
        { terminal: mockTerminal }
      );

      expect(result.status).toBe("existing");
      expect(result.branch).toBe(existingSession.branch);
      expect(mockTerminal.openSession).toHaveBeenCalled();
    });

    it("should create new workspace with fallback naming", async () => {
        vi.mocked(session.findSessionByTask).mockResolvedValue(undefined);
        vi.mocked(naming.generateBranchName).mockReturnValue({
            branch: "feat/fallback-name",
            type: "feat",
            slug: "fallback-name"
        });
        vi.mocked(worktree.createWorktree).mockResolvedValue({
            path: "/path/to/worktrees/feat/fallback-name",
            branch: "feat/fallback-name",
            isMain: false
        });

        const result = await createWorkspace(
            { taskId: "task-new", title: "New Task" },
            mockRepoRoot,
            { opencodeSessionId: "sess-1", terminal: mockTerminal }
        );

        expect(result.status).toBe("created");
        expect(naming.generateBranchName).toHaveBeenCalledWith(
            expect.objectContaining({ id: "task-new" }),
            undefined
        );
        expect(worktree.createWorktree).toHaveBeenCalled();
        expect(session.addSession).toHaveBeenCalled();
        expect(mockTerminal.openSession).toHaveBeenCalled();
    });

    it("should create new workspace using provided slug", async () => {
        vi.mocked(session.findSessionByTask).mockResolvedValue(undefined);
        vi.mocked(naming.generateBranchName).mockReturnValue({
            branch: "fix/my-slug",
            type: "fix",
            slug: "my-slug"
        });
        vi.mocked(worktree.createWorktree).mockResolvedValue({
            path: "/path/to/worktrees/fix/my-slug",
            branch: "fix/my-slug",
            isMain: false
        });

        const result = await createWorkspace(
            { taskId: "task-slug", title: "Slug Task", slug: "my-slug", type: "fix" },
            mockRepoRoot,
            { opencodeSessionId: "sess-2" }
        );

        expect(result.status).toBe("created");
        // Verify naming was called with hint
        expect(naming.generateBranchName).toHaveBeenCalledWith(
            expect.any(Object),
            { type: "fix", slug: "my-slug" }
        );
    });

    it("should executed hooks after creation", async () => {
        vi.mocked(session.findSessionByTask).mockResolvedValue(undefined);
        vi.mocked(naming.generateBranchName).mockReturnValue({ branch: "b", type: "feat", slug: "s" });
        vi.mocked(worktree.createWorktree).mockResolvedValue({ path: "/p", branch: "b", isMain: false });

        const hooksConfig = { afterCreate: ["echo hello"] };
        
        await createWorkspace(
            { taskId: "t", title: "T" },
            mockRepoRoot,
            { opencodeSessionId: "s", hooks: hooksConfig }
        );

        expect(hooks.executeAfterCreateHooks).toHaveBeenCalledWith(hooksConfig, expect.anything());
    });

    it("should rollback worktree on session persistence failure", async () => {
        vi.mocked(session.findSessionByTask).mockResolvedValue(undefined);
        vi.mocked(naming.generateBranchName).mockReturnValue({ branch: "b", type: "feat", slug: "s" });
        vi.mocked(worktree.createWorktree).mockResolvedValue({ path: "/path/to/rollback", branch: "b", isMain: false });
        
        // Simulate session save failure
        vi.mocked(session.addSession).mockRejectedValue(new Error("Save failed"));

        await expect(createWorkspace(
            { taskId: "t", title: "T" },
            mockRepoRoot,
            { opencodeSessionId: "s" }
        )).rejects.toThrow("Save failed");

        expect(worktree.removeWorktree).toHaveBeenCalledWith("/path/to/rollback", true, mockRepoRoot);
    });
  });
});

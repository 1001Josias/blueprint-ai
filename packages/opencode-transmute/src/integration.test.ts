
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { createWorkspace } from "./tools/create-workspace";
import { removeWorktree, worktreeExists } from "./core/worktree";
import { removeSession, findSessionByTask, loadState } from "./core/session";
import { gitExec } from "./core/exec";
import type { TerminalAdapter, OpenSessionOptions } from "./adapters/terminal/types";
import type { CreateWorkspaceInput } from "./tools/create-workspace";

describe("Integration: Full Workspace Workflow", () => {
  let tmpDir: string;
  let originalCwd: string;

  // Mock Terminal Adapter
  const mockTerminal: TerminalAdapter = {
    name: "MockTerminal",
    isAvailable: async () => true,
    openSession: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Create temp directory for the test repository
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-transmute-integration-"));
    
    // Initialize git repo
    await gitExec(["init"], { cwd: tmpDir });
    await gitExec(["config", "user.email", "test@example.com"], { cwd: tmpDir });
    await gitExec(["config", "user.name", "Test User"], { cwd: tmpDir });
    
    // Create initial commit on main
    await gitExec(["commit", "--allow-empty", "-m", "Initial commit"], { cwd: tmpDir });
    // Ensure branch is named 'main' (some systems default to 'master')
    await gitExec(["branch", "-m", "main"], { cwd: tmpDir });
  });

  afterEach(async () => {
    // Cleanup temp dir
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up temp dir:", error);
    }
  });

  it("should create a new workspace, persist session, and open terminal", async () => {
    const input: CreateWorkspaceInput = {
      taskId: "task-1",
      title: "Integration Test Task",
      description: "Testing the full flow",
      priority: "high",
    };

    const options = {
      opencodeSessionId: "session-123",
      terminal: mockTerminal,
      openTerminal: true,
      runHooks: false, // Skip hooks execution to avoid shell issues in test
    };

    // 1. Create Workspace
    const result = await createWorkspace(input, tmpDir, options);

    // Assert Output
    expect(result.status).toBe("created");
    expect(result.taskId).toBe(input.taskId);
    expect(result.taskName).toBe(input.title);
    expect(result.branch).toMatch(/feat\/task-1-integration-test-task/);
    expect(result.worktreePath).toBe(path.join(tmpDir, "worktrees", result.branch.replace(/\//g, "-")));

    // Assert Filesystem
    const worktreeExistsResult = await worktreeExists(result.branch, tmpDir);
    expect(worktreeExistsResult).toBe(true);
    
    const worktreeStat = await fs.stat(result.worktreePath);
    expect(worktreeStat.isDirectory()).toBe(true);

    // Assert Session Persistence
    const session = await findSessionByTask(tmpDir, input.taskId);
    expect(session).toBeDefined();
    expect(session?.branch).toBe(result.branch);
    expect(session?.opencodeSessionId).toBe("session-123");

    // Assert Terminal Interaction
    expect(mockTerminal.openSession).toHaveBeenCalledTimes(1);
    const terminalCallArgs = (mockTerminal.openSession as any).mock.calls[0][0] as OpenSessionOptions;
    expect(terminalCallArgs.cwd).toBe(result.worktreePath);
    expect(terminalCallArgs.title).toContain(input.title);
  });

  it("should resume an existing session correctly", async () => {
    const input: CreateWorkspaceInput = {
      taskId: "task-2",
      title: "Resume Task",
    };

    const options = {
      opencodeSessionId: "session-456",
      terminal: mockTerminal,
    };

    // 1. Create initial session
    const firstResult = await createWorkspace(input, tmpDir, options);
    expect(firstResult.status).toBe("created");

    // Clear mock calls
    vi.clearAllMocks();

    // 2. Resume session (call createWorkspace again)
    const secondResult = await createWorkspace(input, tmpDir, options);

    // Assertions
    expect(secondResult.status).toBe("existing");
    expect(secondResult.branch).toBe(firstResult.branch);
    expect(secondResult.worktreePath).toBe(firstResult.worktreePath);

    // Verify terminal was opened again
    expect(mockTerminal.openSession).toHaveBeenCalledTimes(1);

    // Verify NO new worktree created (checking git list)
    const worktreesList = await gitExec(["worktree", "list", "--porcelain"], { cwd: tmpDir });
    const worktreeLines = worktreesList.stdout.match(/worktree .+/g) || [];
    // Should have main + 1 worktree
    expect(worktreeLines.length).toBe(2);
  });

  it("should handle cleanup of worktree and session", async () => {
    const input: CreateWorkspaceInput = {
      taskId: "task-3",
      title: "Cleanup Task",
    };

    const options = {
      opencodeSessionId: "session-789",
    };

    // 1. Create Workspace
    const result = await createWorkspace(input, tmpDir, options);
    
    // Verify existence
    expect(await worktreeExists(result.branch, tmpDir)).toBe(true);
    expect(await findSessionByTask(tmpDir, input.taskId)).toBeDefined();

    // 2. Remove Worktree
    await removeWorktree(result.worktreePath, true, tmpDir);

    // Verify worktree removal
    expect(await worktreeExists(result.branch, tmpDir)).toBe(false);
    
    // Note: removeWorktree doesn't delete the session automatically in the current implementation
    // The session should still exist in the JSON
    expect(await findSessionByTask(tmpDir, input.taskId)).toBeDefined();

    // 3. Remove Session
    await removeSession(tmpDir, input.taskId);

    // Verify session removal
    expect(await findSessionByTask(tmpDir, input.taskId)).toBeUndefined();
    
    // Verify state file is updated
    const state = await loadState(tmpDir);
    expect(state.sessions.find(s => s.taskId === input.taskId)).toBeUndefined();
  });
});

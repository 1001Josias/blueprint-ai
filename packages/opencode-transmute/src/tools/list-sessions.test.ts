import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";
import { listSessions, listSessionsInputSchema } from "./list-sessions";
import * as worktree from "../core/worktree";
import * as session from "../core/session";
import * as exec from "../core/exec";

// Mock dependencies
vi.mock("../core/worktree");
vi.mock("../core/session");
vi.mock("../core/exec");

describe("List Sessions Tool", () => {
    const mockRepoRoot = "/abs/path/to/repo";

    const mockSessions: session.Session[] = [
        {
            taskId: "task-1",
            taskName: "Active Task",
            branch: "feat/active",
            worktreePath: "/abs/path/to/repo/worktrees/active",
            createdAt: "2023-01-01T00:00:00Z",
            opencodeSessionId: "session-1"
        },
        {
            taskId: "task-2",
            taskName: "Missing Task",
            branch: "feat/missing",
            worktreePath: "/abs/path/to/repo/worktrees/missing",
            createdAt: "2023-01-02T00:00:00Z",
            opencodeSessionId: "session-2"
        }
    ];

    const mockWorktrees: worktree.Worktree[] = [
        {
            path: "/abs/path/to/repo", // Main
            branch: "main",
            isMain: true
        },
        {
            // Matches active session
            path: "/abs/path/to/repo/worktrees/active",
            branch: "feat/active",
            isMain: false
        },
        {
            // Orphaned
            path: "/abs/path/to/repo/worktrees/orphaned",
            branch: "feat/unknown",
            isMain: false
        }
    ];

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(exec.getGitRoot).mockResolvedValue(mockRepoRoot);
        vi.mocked(session.loadState).mockResolvedValue({ sessions: mockSessions });
        vi.mocked(worktree.listWorktrees).mockResolvedValue(mockWorktrees);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should list all sessions correctly classified", async () => {
        const result = await listSessions({});
        
        expect(result.sessions).toHaveLength(3);
        
        const active = result.sessions.find(s => s.taskId === "task-1");
        expect(active).toBeDefined();
        expect(active?.status).toBe("active");
        
        const missing = result.sessions.find(s => s.taskId === "task-2");
        expect(missing).toBeDefined();
        expect(missing?.status).toBe("missing");
        
        const orphaned = result.sessions.find(s => s.branch === "feat/unknown");
        expect(orphaned).toBeDefined();
        expect(orphaned?.status).toBe("orphaned");
    });

    it("should filter by status active", async () => {
        const result = await listSessions({ status: "active" });
        expect(result.sessions).toHaveLength(1);
        expect(result.sessions[0].taskId).toBe("task-1");
    });

    it("should filter by status missing", async () => {
        const result = await listSessions({ status: "missing" });
        expect(result.sessions).toHaveLength(1);
        expect(result.sessions[0].taskId).toBe("task-2");
    });

    it("should filter by status orphaned", async () => {
        const result = await listSessions({ status: "orphaned" });
        expect(result.sessions).toHaveLength(1);
        expect(result.sessions[0].worktreePath).toContain("orphaned");
    });

    it("should validate input schema", () => {
        expect(() => listSessionsInputSchema.parse({ status: "invalid" })).toThrow();
        expect(listSessionsInputSchema.parse({}).status).toBe("all");
    });
});

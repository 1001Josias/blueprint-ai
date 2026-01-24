import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanWorkspaces } from "./clean-workspaces";
import * as worktreeCore from "../core/worktree";
import * as sessionCore from "../core/session";
import * as execCore from "../core/exec";

vi.mock("../core/worktree");
vi.mock("../core/session");
vi.mock("../core/exec");

describe("cleanWorkspaces Tool", () => {
    
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(execCore.getGitRoot).mockResolvedValue("/repo/root");
    });
    
    it("should identify and clean orphaned worktrees", async () => {
        vi.mocked(worktreeCore.listWorktrees).mockResolvedValue([
            { path: "/repo/root", branch: "main", isMain: true },
            { path: "/repo/root/worktrees/active", branch: "feat/active", isMain: false },
            { path: "/repo/root/worktrees/orphan", branch: "feat/orphan", isMain: false }
        ]);
        
        vi.mocked(sessionCore.loadState).mockResolvedValue({
            sessions: [
                { 
                    taskId: "1", 
                    taskName: "Active", 
                    branch: "feat/active", 
                    worktreePath: "/repo/root/worktrees/active",
                    createdAt: new Date().toISOString(),
                    opencodeSessionId: "s1"
                }
            ]
        });
        
        const result = await cleanWorkspaces({
            dryRun: false,
            force: true 
        });
        
        expect(result.cleanedCount).toBe(1);
        expect(result.cleanedPaths).toContain("/repo/root/worktrees/orphan");
        expect(worktreeCore.removeWorktree).toHaveBeenCalledWith("/repo/root/worktrees/orphan", true, "/repo/root");
    });
    
    it("should respect dryRun", async () => {
         vi.mocked(worktreeCore.listWorktrees).mockResolvedValue([
            { path: "/repo/root/worktrees/orphan", branch: "feat/orphan", isMain: false }
        ]);
        vi.mocked(sessionCore.loadState).mockResolvedValue({ sessions: [] });
        
        const result = await cleanWorkspaces({
            dryRun: true,
            force: true
        });
        
        expect(result.cleanedCount).toBe(1);
        expect(result.cleanedPaths[0]).toContain("[DRY RUN]");
        expect(worktreeCore.removeWorktree).not.toHaveBeenCalled();
    });
    
    it("should clean old sessions if maxAgeDays provided", async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);
        
        vi.mocked(worktreeCore.listWorktrees).mockResolvedValue([
            { path: "/repo/root/worktrees/old", branch: "feat/old", isMain: false }
        ]);
        
        vi.mocked(sessionCore.loadState).mockResolvedValue({
            sessions: [
                { 
                    taskId: "1", 
                    taskName: "Old", 
                    branch: "feat/old", 
                    worktreePath: "/repo/root/worktrees/old",
                    createdAt: oldDate.toISOString(),
                    opencodeSessionId: "s1"
                }
            ]
        });
        
        const result = await cleanWorkspaces({
            maxAgeDays: 5,
            force: true,
            dryRun: false
        });
        
        expect(result.cleanedCount).toBe(1);
        expect(result.cleanedPaths).toContain("/repo/root/worktrees/old");
        expect(worktreeCore.removeWorktree).toHaveBeenCalled();
        expect(sessionCore.removeSession).toHaveBeenCalledWith("/repo/root", "1");
    });
});

/**
 * List Sessions Tool
 * 
 * Lists current task sessions and their status.
 * Combines persisted session state with actual git worktree status.
 */

import { z } from "zod";
import path from "path";
import { listWorktrees, type Worktree } from "../core/worktree";
import { loadState, type Session, type SessionState } from "../core/session";
import { getGitRoot } from "../core/exec";

export const listSessionsInputSchema = z.object({
  status: z.enum(["active", "missing", "orphaned", "all"]).optional().default("all"),
});

export type ListSessionsInput = z.infer<typeof listSessionsInputSchema>;

export const sessionInfoSchema = z.object({
  taskId: z.string().optional(),
  taskName: z.string().optional(),
  branch: z.string(),
  worktreePath: z.string(),
  status: z.enum(["active", "missing", "orphaned"]),
  opencodeSessionId: z.string().optional(),
  createdAt: z.string().optional(),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;

export const listSessionsOutputSchema = z.object({
  sessions: z.array(sessionInfoSchema),
});

export type ListSessionsOutput = z.infer<typeof listSessionsOutputSchema>;

/**
 * List Sessions
 * 
 * Returns a comprehensive list of task sessions.
 * - active: Session exists and worktree exists
 * - missing: Session exists but worktree is missing (deleted manually?)
 * - orphaned: Worktree exists (in known location) but no session record
 */
export async function listSessions(input: ListSessionsInput): Promise<ListSessionsOutput> {
    const validated = listSessionsInputSchema.parse(input);
    const repoRoot = await getGitRoot();
    
    // Load state and worktrees in parallel
    const [state, worktrees] = await Promise.all([
        loadState(repoRoot),
        listWorktrees(repoRoot)
    ]);
    
    const results: SessionInfo[] = [];
    
    // 1. Process persisted sessions
    for (const session of state.sessions) {
        const worktreeExists = worktrees.some(wt => 
            // Resolve paths to handle potentially different relative/absolute formats
            path.resolve(wt.path) === path.resolve(session.worktreePath)
        );
        
        if (worktreeExists) {
            results.push({
                taskId: session.taskId,
                taskName: session.taskName,
                branch: session.branch,
                worktreePath: session.worktreePath,
                status: "active",
                opencodeSessionId: session.opencodeSessionId,
                createdAt: session.createdAt
            });
        } else {
            results.push({
                taskId: session.taskId,
                taskName: session.taskName,
                branch: session.branch,
                worktreePath: session.worktreePath,
                status: "missing",
                opencodeSessionId: session.opencodeSessionId,
                createdAt: session.createdAt
            });
        }
    }
    
    // 2. Identify orphaned worktrees
    // We only care about worktrees that look like they belong to us.
    // Hard to be 100% sure, but if they are not the main worktree and not in our session list...
    for (const wt of worktrees) {
        if (wt.isMain) continue;
        
        const isRecorded = state.sessions.some(s => 
            path.resolve(s.worktreePath) === path.resolve(wt.path)
        );
        
        if (!isRecorded) {
            results.push({
                branch: wt.branch,
                worktreePath: wt.path,
                status: "orphaned"
            });
        }
    }
    
    // 3. Filter by request
    const filtered = validated.status === "all" 
        ? results 
        : results.filter(r => r.status === validated.status);
        
    return {
        sessions: filtered
    };
}

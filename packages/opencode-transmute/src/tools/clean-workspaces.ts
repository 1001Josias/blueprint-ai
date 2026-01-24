import { z } from "zod";
import path from "path";
import { listWorktrees, removeWorktree } from "../core/worktree";
import { loadState, removeSession, type SessionState } from "../core/session";
import { getGitRoot } from "../core/exec";

export const cleanWorkspacesInputSchema = z.object({
  maxAgeDays: z.number().int().positive().optional().describe("Clean worktrees older than X days"),
  dryRun: z.boolean().default(false).describe("List what would be deleted without deleting"),
  force: z.boolean().default(false).describe("Force deletion of orphaned worktrees"),
});

export type CleanWorkspacesInput = z.infer<typeof cleanWorkspacesInputSchema>;

export const cleanWorkspacesOutputSchema = z.object({
  cleanedCount: z.number(),
  cleanedPaths: z.array(z.string()),
  errors: z.array(z.string()),
});

export type CleanWorkspacesOutput = z.infer<typeof cleanWorkspacesOutputSchema>;

/**
 * Clean Workspaces Tool
 * 
 * Cleans up old or orphaned worktrees.
 */
export async function cleanWorkspaces(input: CleanWorkspacesInput): Promise<CleanWorkspacesOutput> {
    const validated = cleanWorkspacesInputSchema.parse(input);
    const repoRoot = await getGitRoot();
    
    const output: CleanWorkspacesOutput = {
        cleanedCount: 0,
        cleanedPaths: [],
        errors: [],
    };

    try {
        const worktrees = await listWorktrees(repoRoot);
        const state: SessionState = await loadState(repoRoot);
        const sessions = state.sessions;
        
        for (const wt of worktrees) {
            if (wt.isMain) continue;
            
            const session = sessions.find(s => {
                const sPath = path.resolve(s.worktreePath);
                const wPath = path.resolve(wt.path);
                return sPath === wPath;
            });

            let shouldDelete = false;
            let reason = "";

            if (!session) {
                // Orphaned
                if (wt.path.includes("worktrees") || validated.force) {
                    shouldDelete = true;
                    reason = "Orphaned worktree";
                }
            } else if (validated.maxAgeDays) {
                // Old
                const created = new Date(session.createdAt);
                const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
                if (ageDays > validated.maxAgeDays) {
                    shouldDelete = true;
                    reason = `Older than ${validated.maxAgeDays} days`;
                }
            }

            if (shouldDelete) {
                if (validated.dryRun) {
                    output.cleanedPaths.push(`${wt.path} (${reason}) [DRY RUN]`);
                    output.cleanedCount++;
                } else {
                    try {
                        await removeWorktree(wt.path, validated.force, repoRoot);
                        if (session) {
                            await removeSession(repoRoot, session.taskId);
                        }
                        
                        output.cleanedPaths.push(wt.path);
                        output.cleanedCount++;
                    } catch (err) {
                        output.errors.push(`Failed to remove ${wt.path}: ${(err as Error).message}`);
                    }
                }
            }
        }

    } catch (error) {
        output.errors.push(`General failure: ${(error as Error).message}`);
    }

    return output;
}

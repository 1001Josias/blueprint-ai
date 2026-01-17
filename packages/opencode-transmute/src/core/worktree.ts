/**
 * Git Worktree Management
 *
 * Provides functions for creating and managing git worktrees.
 * Worktrees allow working on multiple branches simultaneously
 * in separate directories.
 */

import { z } from "zod";

/**
 * Represents a git worktree
 */
export interface Worktree {
  /** Absolute path to the worktree directory */
  path: string;
  /** Branch checked out in this worktree */
  branch: string;
  /** Whether this is the main worktree (original repo) */
  isMain: boolean;
  /** HEAD commit hash */
  head?: string;
}

/**
 * Options for creating a new worktree
 */
export interface CreateWorktreeOptions {
  /** Branch name to create/checkout */
  branch: string;
  /** Base branch to create from (default: "main") */
  baseBranch?: string;
  /** Target directory for the worktree (default: "./worktrees/<branch>") */
  targetDir?: string;
}

export const worktreeSchema = z.object({
  path: z.string(),
  branch: z.string(),
  isMain: z.boolean(),
  head: z.string().optional(),
});

export const createWorktreeOptionsSchema = z.object({
  branch: z.string().min(1),
  baseBranch: z.string().optional(),
  targetDir: z.string().optional(),
});

/**
 * List all worktrees in the repository
 *
 * @returns Array of worktree information
 *
 * @example
 * ```ts
 * const worktrees = await listWorktrees()
 * // [
 * //   { path: "/repo", branch: "main", isMain: true },
 * //   { path: "/repo/worktrees/feat-auth", branch: "feat/auth", isMain: false }
 * // ]
 * ```
 */
export async function listWorktrees(): Promise<Worktree[]> {
  // TODO: Implement in Task 3 (oc-trans-003)
  // Execute: git worktree list --porcelain
  // Parse output into Worktree objects
  throw new Error("Not implemented - see Task oc-trans-003");
}

/**
 * Create a new worktree for a branch
 *
 * @param options - Worktree creation options
 * @returns The created worktree information
 *
 * @example
 * ```ts
 * const worktree = await createWorktree({
 *   branch: "feat/new-feature",
 *   baseBranch: "main"
 * })
 * ```
 */
export async function createWorktree(
  options: CreateWorktreeOptions,
): Promise<Worktree> {
  // Validate input
  createWorktreeOptionsSchema.parse(options);

  // TODO: Implement in Task 3 (oc-trans-003)
  // 1. Check if branch already exists
  // 2. Create worktrees directory if needed
  // 3. Execute: git worktree add -b <branch> <path> <base>
  throw new Error("Not implemented - see Task oc-trans-003");
}

/**
 * Check if a worktree exists for a specific branch
 *
 * @param branch - Branch name to check
 * @returns True if worktree exists
 */
export async function worktreeExists(_branch: string): Promise<boolean> {
  // TODO: Implement in Task 3 (oc-trans-003)
  throw new Error("Not implemented - see Task oc-trans-003");
}

/**
 * Remove a worktree
 *
 * @param path - Path to the worktree to remove
 * @param force - Force removal even if there are uncommitted changes
 */
export async function removeWorktree(
  _path: string,
  _force = false,
): Promise<void> {
  // TODO: Implement in Task 12 (oc-trans-012) - Post-MVP
  throw new Error("Not implemented - see Task oc-trans-012");
}

/**
 * Get the default worktrees directory
 *
 * @param baseDir - Base directory (repository root)
 * @returns Path to worktrees directory
 */
export function getWorktreesDir(baseDir: string): string {
  return `${baseDir}/worktrees`;
}

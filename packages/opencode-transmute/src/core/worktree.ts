/**
 * Git Worktree Management
 *
 * Provides functions for creating and managing git worktrees.
 * Worktrees allow working on multiple branches simultaneously
 * in separate directories.
 */

import { z } from "zod";
import { mkdir, access, constants } from "node:fs/promises";
import { join } from "node:path";
import { gitExec, getGitRoot, branchExists as checkBranchExists } from "./exec";
import {
  createBranchAlreadyExistsError,
  createDirectoryAlreadyExistsError,
  createBaseBranchNotFoundError,
} from "./errors";

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
  /** Base directory for worktrees (default: "worktrees") */
  worktreesDir?: string;
  /** Working directory (repository root) */
  cwd?: string;
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
  worktreesDir: z.string().optional(),
  cwd: z.string().optional(),
});

/**
 * Parse the output of `git worktree list --porcelain`
 *
 * Format:
 * ```
 * worktree /path/to/main
 * HEAD abc123def456789
 * branch refs/heads/main
 *
 * worktree /path/to/worktrees/feat-auth
 * HEAD def456abc789012
 * branch refs/heads/feat/auth
 * ```
 *
 * @param output - Raw output from git worktree list --porcelain
 * @param mainWorktreePath - Path to the main worktree (for isMain detection)
 * @returns Array of parsed worktrees
 */
export function parseWorktreeListOutput(
  output: string,
  mainWorktreePath: string,
): Worktree[] {
  const worktrees: Worktree[] = [];
  const blocks = output.trim().split(/\n\n+/);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split("\n");
    let path = "";
    let head: string | undefined;
    let branch = "";

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        path = line.slice("worktree ".length).trim();
      } else if (line.startsWith("HEAD ")) {
        head = line.slice("HEAD ".length).trim();
      } else if (line.startsWith("branch ")) {
        // Branch is in format "refs/heads/branch-name"
        const fullRef = line.slice("branch ".length).trim();
        branch = fullRef.replace(/^refs\/heads\//, "");
      } else if (line.startsWith("detached")) {
        // Detached HEAD state
        branch = "(detached)";
      }
    }

    if (path) {
      // Normalize paths for comparison
      const normalizedPath = path.replace(/\/+$/, "");
      const normalizedMainPath = mainWorktreePath.replace(/\/+$/, "");

      worktrees.push({
        path,
        branch,
        head,
        isMain: normalizedPath === normalizedMainPath,
      });
    }
  }

  return worktrees;
}

/**
 * List all worktrees in the repository
 *
 * @param cwd - Working directory (defaults to current directory)
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
export async function listWorktrees(cwd?: string): Promise<Worktree[]> {
  // Get the main worktree path (git root)
  const mainPath = await getGitRoot(cwd);

  // Execute git worktree list --porcelain
  const result = await gitExec(["worktree", "list", "--porcelain"], { cwd });

  // Parse the output
  return parseWorktreeListOutput(result.stdout, mainPath);
}

/**
 * Create a new worktree for a branch
 *
 * @param options - Worktree creation options
 * @returns The created worktree information
 *
 * @throws BranchAlreadyExistsError - When branch exists and has a worktree
 * @throws DirectoryAlreadyExistsError - When target directory exists
 * @throws BaseBranchNotFoundError - When base branch doesn't exist
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
  const validated = createWorktreeOptionsSchema.parse(options);
  const { branch, baseBranch = "main", cwd } = validated;

  // Get the git root
  const gitRoot = await getGitRoot(cwd);

  // Determine target directory
  // Convert branch name to a valid directory name (replace / with -)
  const branchSlug = branch.replace(/\//g, "-");
  const targetDir =
    validated.targetDir ||
    join(gitRoot, validated.worktreesDir || "worktrees", branchSlug);

  // Check if branch already exists
  const branchExistsLocally = await checkBranchExists(branch, cwd);

  // Check if worktree already exists for this branch
  if (branchExistsLocally) {
    const existingWorktrees = await listWorktrees(cwd);
    const existingWorktree = existingWorktrees.find(
      (wt) => wt.branch === branch,
    );
    if (existingWorktree) {
      throw createBranchAlreadyExistsError(branch);
    }
  }

  // Check if target directory already exists
  try {
    await access(targetDir, constants.F_OK);
    // If we get here, the directory exists
    throw createDirectoryAlreadyExistsError(targetDir);
  } catch (err) {
    // Directory doesn't exist - this is what we want
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }

  // Check if base branch exists
  const baseExists = await checkBranchExists(baseBranch, cwd);
  if (!baseExists) {
    throw createBaseBranchNotFoundError(baseBranch);
  }

  // Try to update base branch from remote to ensure we start from latest
  try {
    // Only try to update if it's not the current checked out branch
    // (git won't let us update current branch with fetch dst:src)
    const currentBranchResult = await gitExec(
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd, throwOnError: false },
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (currentBranch !== baseBranch) {
      // Try to fetch and update local ref: git fetch origin base:base
      // We use throwOnError: false because this might fail if:
      // 1. Remote 'origin' doesn't exist
      // 2. Remote branch doesn't exist
      // 3. Not a fast-forward update
      await gitExec(["fetch", "origin", `${baseBranch}:${baseBranch}`], {
        cwd,
        throwOnError: false,
      });
    } else {
      // If we are on the base branch, try a simple pull
      await gitExec(["pull"], { cwd, throwOnError: false });
    }
  } catch {
    // Ignore update errors - fallback to using local version of base branch
  }

  // Create parent directory if it doesn't exist
  const parentDir = join(targetDir, "..");
  await mkdir(parentDir, { recursive: true });

  // Create the worktree
  // If branch doesn't exist, use -b to create it
  // If branch exists (but no worktree), just checkout
  const gitArgs = branchExistsLocally
    ? ["worktree", "add", targetDir, branch]
    : ["worktree", "add", "-b", branch, targetDir, baseBranch];

  await gitExec(gitArgs, { cwd });

  // Get the HEAD commit for the new worktree
  const headResult = await gitExec(["rev-parse", "HEAD"], { cwd: targetDir });
  const head = headResult.stdout.trim();

  return {
    path: targetDir,
    branch,
    isMain: false,
    head,
  };
}

/**
 * Check if a worktree exists for a specific branch
 *
 * @param branch - Branch name to check
 * @param cwd - Working directory
 * @returns True if worktree exists
 */
export async function worktreeExists(
  branch: string,
  cwd?: string,
): Promise<boolean> {
  const worktrees = await listWorktrees(cwd);
  return worktrees.some((wt) => wt.branch === branch);
}

/**
 * Get a worktree by branch name
 *
 * @param branch - Branch name to find
 * @param cwd - Working directory
 * @returns Worktree if found, undefined otherwise
 */
export async function getWorktreeByBranch(
  branch: string,
  cwd?: string,
): Promise<Worktree | undefined> {
  const worktrees = await listWorktrees(cwd);
  return worktrees.find((wt) => wt.branch === branch);
}

/**
 * Remove a worktree
 *
 * @param path - Path to the worktree to remove
 * @param force - Force removal even if there are uncommitted changes
 * @param cwd - Working directory
 */
export async function removeWorktree(
  path: string,
  force = false,
  cwd?: string,
): Promise<void> {
  const args = ["worktree", "remove"];
  if (force) {
    args.push("--force");
  }
  args.push(path);

  await gitExec(args, { cwd });
}

/**
 * Prune stale worktree metadata
 *
 * Removes worktree administrative files for worktrees whose
 * directories have been deleted.
 *
 * @param cwd - Working directory
 */
export async function pruneWorktrees(cwd?: string): Promise<void> {
  await gitExec(["worktree", "prune"], { cwd });
}

/**
 * Get the default worktrees directory
 *
 * @param baseDir - Base directory (repository root)
 * @returns Path to worktrees directory
 */
export function getWorktreesDir(baseDir: string): string {
  return join(baseDir, "worktrees");
}

/**
 * Get the default worktree path for a branch
 *
 * @param baseDir - Base directory (repository root)
 * @param branch - Branch name
 * @returns Path where worktree would be created
 */
export function getWorktreePath(baseDir: string, branch: string): string {
  const branchSlug = branch.replace(/\//g, "-");
  return join(getWorktreesDir(baseDir), branchSlug);
}

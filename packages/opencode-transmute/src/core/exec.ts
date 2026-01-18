/**
 * Command Execution Utilities
 *
 * Provides a consistent interface for executing shell commands,
 * primarily used for git operations.
 */

import { spawn } from "node:child_process";
import { ExecError, GitNotInitializedError } from "./errors";

/**
 * Result of a command execution
 */
export interface ExecResult {
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code (0 = success) */
  exitCode: number;
}

/**
 * Options for command execution
 */
export interface ExecOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Throw on non-zero exit code (default: true) */
  throwOnError?: boolean;
}

/**
 * Execute a command with arguments
 *
 * @param command - The command to execute
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Execution result with stdout, stderr, and exit code
 * @throws ExecError when command fails and throwOnError is true
 *
 * @example
 * ```ts
 * const result = await exec("git", ["status"], { cwd: "/path/to/repo" });
 * console.log(result.stdout);
 * ```
 */
export async function exec(
  command: string,
  args: string[],
  options: ExecOptions = {},
): Promise<ExecResult> {
  const { cwd, throwOnError = true } = options;

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      reject(new ExecError(`${command} ${args.join(" ")}`, err.message, -1));
    });

    proc.on("close", (code) => {
      const exitCode = code ?? 0;
      const result: ExecResult = { stdout, stderr, exitCode };

      if (throwOnError && exitCode !== 0) {
        reject(
          new ExecError(
            `${command} ${args.join(" ")}`,
            stderr || stdout,
            exitCode,
          ),
        );
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Execute a git command
 *
 * Wrapper around exec() specifically for git commands.
 * Provides better error handling for common git errors.
 *
 * @param args - Git command arguments (without "git" prefix)
 * @param options - Execution options
 * @returns Execution result
 * @throws GitNotInitializedError when not in a git repository
 * @throws ExecError for other git errors
 *
 * @example
 * ```ts
 * const result = await gitExec(["worktree", "list", "--porcelain"]);
 * console.log(result.stdout);
 * ```
 */
export async function gitExec(
  args: string[],
  options: ExecOptions = {},
): Promise<ExecResult> {
  try {
    return await exec("git", args, options);
  } catch (error) {
    if (error instanceof ExecError) {
      // Check for common git error patterns
      if (
        error.stderr.includes("not a git repository") ||
        error.stderr.includes("fatal: not a git repository")
      ) {
        throw new GitNotInitializedError(options.cwd || process.cwd());
      }
    }
    throw error;
  }
}

/**
 * Check if a directory is a git repository
 *
 * @param cwd - Directory to check
 * @returns True if the directory is a git repository
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  try {
    await exec("git", ["rev-parse", "--git-dir"], {
      cwd,
      throwOnError: true,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the root directory of the git repository
 *
 * @param cwd - Starting directory
 * @returns Absolute path to the repository root
 * @throws GitNotInitializedError when not in a git repository
 */
export async function getGitRoot(cwd?: string): Promise<string> {
  const result = await gitExec(["rev-parse", "--show-toplevel"], { cwd });
  return result.stdout.trim();
}

/**
 * Check if a git branch exists
 *
 * @param branch - Branch name to check
 * @param cwd - Repository directory
 * @returns True if branch exists
 */
export async function branchExists(
  branch: string,
  cwd?: string,
): Promise<boolean> {
  const result = await exec("git", ["branch", "--list", branch], {
    cwd,
    throwOnError: false,
  });
  return result.stdout.trim().length > 0;
}

/**
 * Check if a remote branch exists
 *
 * @param branch - Branch name to check (without remote prefix)
 * @param remote - Remote name (default: "origin")
 * @param cwd - Repository directory
 * @returns True if remote branch exists
 */
export async function remoteBranchExists(
  branch: string,
  remote = "origin",
  cwd?: string,
): Promise<boolean> {
  const result = await exec("git", ["ls-remote", "--heads", remote, branch], {
    cwd,
    throwOnError: false,
  });
  return result.stdout.trim().length > 0;
}

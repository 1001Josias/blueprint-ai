/**
 * Custom Errors for Git Worktree Operations
 *
 * Provides typed errors for better error handling in worktree operations.
 */

/**
 * Error codes for worktree operations
 */
export const WorktreeErrorCode = {
  BRANCH_EXISTS: "BRANCH_EXISTS",
  DIR_EXISTS: "DIR_EXISTS",
  NO_GIT_REPO: "NO_GIT_REPO",
  BASE_NOT_FOUND: "BASE_NOT_FOUND",
  WORKTREE_NOT_FOUND: "WORKTREE_NOT_FOUND",
  EXEC_FAILED: "EXEC_FAILED",
} as const;

export type WorktreeErrorCodeType =
  (typeof WorktreeErrorCode)[keyof typeof WorktreeErrorCode];

/**
 * Base error class for worktree operations
 */
export class WorktreeError extends Error {
  readonly code: WorktreeErrorCodeType;

  constructor(message: string, code: WorktreeErrorCodeType) {
    super(message);
    this.name = "WorktreeError";
    this.code = code;
  }
}

/**
 * Thrown when a git branch already exists
 */
export class BranchAlreadyExistsError extends WorktreeError {
  readonly branch: string;

  constructor(branch: string) {
    super(
      `Branch '${branch}' already exists. Use a different branch name or checkout the existing branch.`,
      WorktreeErrorCode.BRANCH_EXISTS,
    );
    this.name = "BranchAlreadyExistsError";
    this.branch = branch;
  }
}

/**
 * Thrown when the target directory already exists
 */
export class DirectoryAlreadyExistsError extends WorktreeError {
  readonly path: string;

  constructor(path: string) {
    super(
      `Directory '${path}' already exists. Choose a different path or remove the existing directory.`,
      WorktreeErrorCode.DIR_EXISTS,
    );
    this.name = "DirectoryAlreadyExistsError";
    this.path = path;
  }
}

/**
 * Thrown when not in a git repository
 */
export class GitNotInitializedError extends WorktreeError {
  readonly path: string;

  constructor(path: string) {
    super(
      `Not a git repository: '${path}'. Initialize git or navigate to a git repository.`,
      WorktreeErrorCode.NO_GIT_REPO,
    );
    this.name = "GitNotInitializedError";
    this.path = path;
  }
}

/**
 * Thrown when the base branch doesn't exist
 */
export class BaseBranchNotFoundError extends WorktreeError {
  readonly branch: string;

  constructor(branch: string) {
    super(
      `Base branch '${branch}' not found. Verify the branch name or fetch from remote.`,
      WorktreeErrorCode.BASE_NOT_FOUND,
    );
    this.name = "BaseBranchNotFoundError";
    this.branch = branch;
  }
}

/**
 * Thrown when a worktree is not found
 */
export class WorktreeNotFoundError extends WorktreeError {
  readonly branch: string;

  constructor(branch: string) {
    super(
      `Worktree for branch '${branch}' not found.`,
      WorktreeErrorCode.WORKTREE_NOT_FOUND,
    );
    this.name = "WorktreeNotFoundError";
    this.branch = branch;
  }
}

/**
 * Thrown when command execution fails
 */
export class ExecError extends WorktreeError {
  readonly command: string;
  readonly stderr: string;
  readonly exitCode: number;

  constructor(command: string, stderr: string, exitCode: number) {
    super(
      `Command failed: ${command}\nExit code: ${exitCode}\n${stderr}`,
      WorktreeErrorCode.EXEC_FAILED,
    );
    this.name = "ExecError";
    this.command = command;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

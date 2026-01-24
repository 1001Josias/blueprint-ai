/**
 * Create Workspace Tool
 *
 * Main tool that orchestrates the creation of isolated task environments.
 * Combines AI branch naming input (optional), worktree creation, session persistence,
 * and terminal integration.
 */

import { z } from "zod";
import {
  generateBranchName,
  branchTypeSchema,
  type TaskContext,
  type BranchType,
} from "../core/naming";
import { createWorktree, removeWorktree } from "../core/worktree";
import { findSessionByTask, addSession, type Session } from "../core/session";
import { executeAfterCreateHooks, type HooksConfig } from "../core/hooks";
import { getGitRoot } from "../core/exec";
import type {
  TerminalAdapter,
  OpenSessionOptions,
} from "../adapters/terminal/types";

/**
 * Input schema for the create-workspace tool
 */
export const createWorkspaceInputSchema = z.object({
  taskId: z.string().min(1).describe("Unique task identifier"),
  title: z.string().min(1).describe("Task title"),
  description: z.string().optional().describe("Task description"),
  priority: z.string().optional().describe("Task priority"),
  type: branchTypeSchema
    .optional()
    .describe("Branch type hint: feat, fix, refactor, etc."),
  slug: z
    .string()
    .optional()
    .describe("Pre-generated branch slug (max 40 chars) from AI agent"),
  baseBranch: z.string().optional().describe("Base branch (default: main)"),
});

/**
 * Input type for the create-workspace tool
 */
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;

/**
 * Output schema for the create-workspace tool
 */
export const createWorkspaceOutputSchema = z.object({
  status: z.enum(["created", "existing"]),
  branch: z.string(),
  worktreePath: z.string(),
  taskId: z.string(),
  taskName: z.string(),
  opencodeSessionId: z.string().optional(),
});

/**
 * Output type for the create-workspace tool
 */
export type CreateWorkspaceOutput = z.infer<typeof createWorkspaceOutputSchema>;

/**
 * Options for the createWorkspace function
 */
export interface CreateWorkspaceOptions {
  /** OpenCode session ID for session linking */
  opencodeSessionId?: string;
  /** Terminal adapter for opening sessions */
  terminal?: TerminalAdapter;
  /** Hooks configuration for lifecycle commands */
  hooks?: HooksConfig;
  /** Whether to open terminal after creating worktree (default: true) */
  openTerminal?: boolean;
  /** Whether to run hooks after creating worktree (default: true) */
  runHooks?: boolean;
  /** Initial commands to run in terminal */
  terminalCommands?: string[];
}

/**
 * Create a workspace by setting up a worktree session for a task
 *
 * Flow:
 * 1. Check if session exists for taskId
 * 2. If exists, return existing worktree (and optionally open terminal)
 * 3. Generate branch name (using provided slug/type or fallback)
 * 4. Create worktree
 * 5. Persist session
 * 6. Open terminal in worktree (if adapter provided)
 * 7. Execute afterCreateHooks
 * 8. Return result
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  basePath?: string,
  options: CreateWorkspaceOptions = {},
): Promise<CreateWorkspaceOutput> {
  // Validate input
  const validatedInput = createWorkspaceInputSchema.parse(input);

  // Get repository root
  const repoRoot = basePath || (await getGitRoot());

  // Extract options with defaults
  const {
    opencodeSessionId,
    terminal,
    hooks,
    openTerminal = true,
    runHooks = true,
    terminalCommands,
  } = options;

  // 1. Check if session already exists for this task
  const existingSession = await findSessionByTask(
    repoRoot,
    validatedInput.taskId,
  );

  if (existingSession) {
    // Session exists - return existing worktree
    const result: CreateWorkspaceOutput = {
      status: "existing",
      branch: existingSession.branch,
      worktreePath: existingSession.worktreePath,
      taskId: existingSession.taskId,
      taskName: existingSession.taskName,
      opencodeSessionId: existingSession.opencodeSessionId,
    };

    // Optionally open terminal for existing session
    if (openTerminal && terminal) {
      await openTerminalSession(terminal, existingSession, { additionalCommands: terminalCommands, isNew: false });
    }

    return result;
  }

  // 2. Generate branch name
  const taskContext: TaskContext = {
    id: validatedInput.taskId,
    title: validatedInput.title,
    description: validatedInput.description,
    priority: validatedInput.priority,
    type: validatedInput.type,
  };

  // Prepare branch name hint if slug is provided
  // If slug is provided, we assume the agent already did the thinking.
  let branchNameHint: { type: BranchType; slug: string } | undefined;
  
  if (validatedInput.slug) {
     branchNameHint = {
        type: validatedInput.type || "feat", 
        slug: validatedInput.slug
     };
  }

  const branchResult = generateBranchName(taskContext, branchNameHint);

  // 3. Create worktree
  const worktree = await createWorktree({
    branch: branchResult.branch,
    baseBranch: validatedInput.baseBranch || "main",
    cwd: repoRoot,
  });

  // 4. Persist session, hooks, and terminal (with rollback)
  try {
    // Persist session (requires opencodeSessionId)
    if (!opencodeSessionId) {
      throw new Error(
        "opencodeSessionId is required to create a new session. " +
          "This ensures conversation continuity when resuming tasks.",
      );
    }

    const newSession: Session = {
      taskId: validatedInput.taskId,
      taskName: validatedInput.title,
      branch: branchResult.branch,
      worktreePath: worktree.path,
      createdAt: new Date().toISOString(),
      opencodeSessionId,
    };

    await addSession(repoRoot, newSession);

    // 5. Execute afterCreate hooks
    if (runHooks && hooks?.afterCreate && hooks.afterCreate.length > 0) {
      await executeAfterCreateHooks(hooks, {
        cwd: worktree.path,
        stopOnError: false, 
      });
    }

    // 6. Open terminal in worktree
    if (openTerminal && terminal) {
      await openTerminalSession(terminal, newSession, {
        additionalCommands: terminalCommands,
        isNew: true,
        description: validatedInput.description
      });
    }
  } catch (error) {
    // Rollback: Remove the worktree if something failed
    console.error(
      `[transmute] Failed to initialize workspace. Rolling back worktree ${worktree.path}`,
      error,
    );
    try {
      await removeWorktree(worktree.path, true, repoRoot);
    } catch (rollbackError) {
      console.error(
        `[transmute] Failed to rollback worktree ${worktree.path}`,
        rollbackError,
      );
    }
    throw error;
  }

  // 7. Return result
  return {
    status: "created",
    branch: branchResult.branch,
    worktreePath: worktree.path,
    taskId: validatedInput.taskId,
    taskName: validatedInput.title,
    opencodeSessionId,
  };
}

/**
 * Open a terminal session for a task
 */
async function openTerminalSession(
  terminal: TerminalAdapter,
  session: Session,
  options: { additionalCommands?: string[]; isNew?: boolean; description?: string } = {},
): Promise<void> {
  const isAvailable = await terminal.isAvailable();
  if (!isAvailable) {
    console.warn(
      `[transmute] Terminal '${terminal.name}' is not available, skipping terminal open`,
    );
    return;
  }

  const commands: string[] = [];

  if (session.opencodeSessionId) {
    let cmd = `opencode --session ${session.opencodeSessionId}`;
    
    if (options.isNew) {
      // For new sessions, inject context
      const context = `Task ${session.taskId}: ${session.taskName}\n${options.description || ""}`;
      // Sanitize context for shell (basic)
      const sanitizedContext = context.replace(/"/g, '\\"');
      cmd += ` --prompt "${sanitizedContext}"`;
    }
    
    commands.push(cmd);
  }

  if (options.additionalCommands && options.additionalCommands.length > 0) {
    commands.push(...options.additionalCommands);
  }

  const sessionOptions: OpenSessionOptions = {
    cwd: session.worktreePath,
    title: `${session.taskName} (${session.branch})`,
    commands: commands.length > 0 ? commands : undefined,
  };

  try {
    await terminal.openSession(sessionOptions);
  } catch (error) {
    console.warn(`[transmute] Failed to open terminal session:`, error);
  }
}

/**
 * Resume an existing workspace session
 */
export async function resumeWorkspace(
  taskId: string,
  basePath?: string,
  options: Pick<CreateWorkspaceOptions, "terminal" | "terminalCommands"> = {},
): Promise<Session | undefined> {
  const repoRoot = basePath || (await getGitRoot());
  const session = await findSessionByTask(repoRoot, taskId);

  if (session && options.terminal) {
    await openTerminalSession(
      options.terminal,
      session,
      { additionalCommands: options.terminalCommands }
    );
  }

  return session;
}

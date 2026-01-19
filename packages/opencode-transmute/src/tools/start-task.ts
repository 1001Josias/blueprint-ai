/**
 * Start Task Tool
 *
 * Main tool that orchestrates the creation of isolated task environments.
 * Combines AI branch naming, worktree creation, session persistence,
 * and terminal integration.
 */

import { z } from "zod";
import {
  generateBranchName,
  type OpenCodeClient,
  type TaskContext,
} from "../core/naming";
import { createWorktree } from "../core/worktree";
import { findSessionByTask, addSession, type Session } from "../core/session";
import { executeAfterCreateHooks, type HooksConfig } from "../core/hooks";
import { getGitRoot } from "../core/exec";
import { loadConfig, type Config } from "../core/config";
import type {
  TerminalAdapter,
  OpenSessionOptions,
} from "../adapters/terminal/types";

/**
 * Input schema for the start-task tool
 */
export const startTaskInputSchema = z.object({
  taskId: z.string().min(1).describe("Unique task identifier"),
  title: z.string().min(1).describe("Task title"),
  description: z.string().optional().describe("Task description"),
  priority: z.string().optional().describe("Task priority"),
  type: z
    .string()
    .optional()
    .describe("Branch type hint: feat, fix, refactor, etc."),
  baseBranch: z.string().optional().describe("Base branch (default: main)"),
});

/**
 * Input type for the start-task tool
 */
export type StartTaskInput = z.infer<typeof startTaskInputSchema>;

/**
 * Output schema for the start-task tool
 */
export const startTaskOutputSchema = z.object({
  status: z.enum(["created", "existing", "failed"]),
  branch: z.string().optional(),
  worktreePath: z.string().optional(),
  taskId: z.string(),
  taskName: z.string().optional(),
  opencodeSessionId: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Output type for the start-task tool
 */
export type StartTaskOutput = z.infer<typeof startTaskOutputSchema>;

/**
 * Options for the startTask function
 */
export interface StartTaskOptions {
  /** OpenCode client for AI branch naming */
  client?: OpenCodeClient;
  /** OpenCode session ID for AI calls and session linking */
  opencodeSessionId?: string;
  /** Terminal adapter for opening sessions */
  terminal?: TerminalAdapter;
  /** Hooks configuration for lifecycle commands */
  hooks?: HooksConfig;
  /** Plugin configuration */
  config?: Config;
  /** Whether to open terminal after creating worktree (default: true) */
  openTerminal?: boolean;
  /** Whether to run hooks after creating worktree (default: true) */
  runHooks?: boolean;
  /** Initial commands to run in terminal */
  terminalCommands?: string[];
}

/**
 * Start a task by creating or resuming a worktree session
 *
 * Flow:
 * 1. Check if session exists for taskId
 * 2. If exists, return existing worktree (and optionally open terminal)
 * 3. Generate branch name via AI (or fallback)
 * 4. Create worktree
 * 5. Persist session
 * 6. Open terminal in worktree (if adapter provided)
 * 7. Execute afterCreate hooks
 * 8. Return result
 *
 * @param input - Task information
 * @param basePath - Repository root path (optional, defaults to git root)
 * @param options - Additional options
 * @returns Result with worktree information
 *
 * @example
 * ```ts
 * const result = await startTask({
 *   taskId: "task-123",
 *   title: "Implement OAuth login",
 *   description: "Add Google OAuth support"
 * }, "/path/to/repo", {
 *   client: openCodeClient,
 *   opencodeSessionId: "session-abc",
 *   terminal: wezTermAdapter,
 *   hooks: { afterCreate: ["pnpm install"] }
 * })
 *
 * // result: {
 * //   status: "created",
 * //   branch: "feat/implement-oauth-login",
 * //   worktreePath: "/path/to/repo/worktrees/feat-implement-oauth-login",
 * //   taskId: "task-123",
 * //   taskName: "Implement OAuth login",
 * //   opencodeSessionId: "session-abc"
 * // }
 * ```
 */
export async function startTask(
  input: StartTaskInput,
  basePath?: string,
  options: StartTaskOptions = {},
): Promise<StartTaskOutput> {
  // Extract options with defaults
  const {
    client,
    opencodeSessionId,
    terminal,
    openTerminal = true,
    runHooks = true,
    terminalCommands,
  } = options;

  let validatedInput: StartTaskInput;

  // Validate input
  try {
    validatedInput = startTaskInputSchema.parse(input);
  } catch (error) {
    if (client) {
      await client.app?.log({
        body: {
          service: "opencode-transmute",
          level: "error",
          message: `Invalid input for start-task: ${(error as Error).message}`,
        },
      });
    }

    // Log to console for visibility
    console.error(`[opencode-transmute] Invalid input for start-task:`, error);

    return {
      status: "failed",
      taskId: input.taskId || "unknown",
      message: `Invalid input: ${(error as Error).message}`,
    };
  }

  try {
    // Get repository root
    const repoRoot = basePath || (await getGitRoot());

    // Load configuration
    const config = options.config || (await loadConfig(repoRoot)).config;

    // Merge hooks from options and config
    const activeHooks = options.hooks || config.hooks;

    // 1. Check if session already exists for this task
    const existingSession = await findSessionByTask(
      repoRoot,
      validatedInput.taskId,
    );

    if (existingSession) {
      // Session exists - return existing worktree
      const result: StartTaskOutput = {
        status: "existing",
        branch: existingSession.branch,
        worktreePath: existingSession.worktreePath,
        taskId: existingSession.taskId,
        taskName: existingSession.taskName,
        opencodeSessionId: existingSession.opencodeSessionId,
      };

      // Optionally open terminal for existing session
      if (openTerminal && terminal) {
        await openTerminalSession(terminal, existingSession, terminalCommands);
      }

      return result;
    }

    // 2. Generate branch name via AI (or fallback)
    const taskContext: TaskContext = {
      id: validatedInput.taskId,
      title: validatedInput.title,
      description: validatedInput.description,
      priority: validatedInput.priority,
      type: validatedInput.type,
    };

    const branchResult = await generateBranchName(
      taskContext,
      client,
      opencodeSessionId,
    );

    // 3. Create worktree
    const worktree = await createWorktree({
      branch: branchResult.branch,
      baseBranch: validatedInput.baseBranch || "main",
      worktreesDir: config.worktreesDir,
      cwd: repoRoot,
    });

    // 4. Persist session (requires opencodeSessionId)
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
    if (
      runHooks &&
      activeHooks?.afterCreate &&
      activeHooks.afterCreate.length > 0
    ) {
      await executeAfterCreateHooks(activeHooks, {
        cwd: worktree.path,
        stopOnError: false, // Don't fail the whole operation if hooks fail
      });
    }

    // 6. Open terminal in worktree
    if (openTerminal && terminal) {
      await openTerminalSession(terminal, newSession, terminalCommands);
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log to console for visibility
    console.error(
      `[opencode-transmute] Error in start-task implementation:`,
      error,
    );

    if (client) {
      await client.app?.log({
        body: {
          service: "opencode-transmute",
          level: "error",
          message: `Critical error in start-task: ${errorMessage}`,
        },
      });
    }
    return {
      status: "failed",
      taskId: input.taskId || "unknown",
      message: errorMessage,
    };
  }
}

/**
 * Open a terminal session for a task
 *
 * @param terminal - Terminal adapter
 * @param session - Session to open
 * @param additionalCommands - Additional commands to run
 */
async function openTerminalSession(
  terminal: TerminalAdapter,
  session: Session,
  additionalCommands?: string[],
): Promise<void> {
  // Check if terminal is available
  const isAvailable = await terminal.isAvailable();
  if (!isAvailable) {
    console.warn(
      `[transmute] Terminal '${terminal.name}' is not available, skipping terminal open`,
    );
    return;
  }

  // Build commands to run in terminal
  const commands: string[] = [];

  // Start a fresh OpenCode session in the worktree
  // Each worktree gets its own isolated session since OpenCode sessions are project-specific
  // (sessions are bound to the directory they were created in)
  commands.push("opencode");

  // Add any additional commands
  if (additionalCommands && additionalCommands.length > 0) {
    commands.push(...additionalCommands);
  }

  const options: OpenSessionOptions = {
    cwd: session.worktreePath,
    title: `${session.taskName} (${session.branch})`,
    commands: commands.length > 0 ? commands : undefined,
  };

  try {
    await terminal.openSession(options);
  } catch (error) {
    // Log but don't fail - terminal is a nice-to-have
    console.warn(`[transmute] Failed to open terminal session:`, error);
  }
}

/**
 * Resume an existing task session
 *
 * Convenience function that finds an existing session and opens terminal.
 *
 * @param taskId - Task ID to resume
 * @param basePath - Repository root path
 * @param options - Options (terminal, commands)
 * @returns Session if found, undefined otherwise
 */
export async function resumeTask(
  taskId: string,
  basePath?: string,
  options: Pick<StartTaskOptions, "terminal" | "terminalCommands"> = {},
): Promise<Session | undefined> {
  const repoRoot = basePath || (await getGitRoot());
  const session = await findSessionByTask(repoRoot, taskId);

  if (session && options.terminal) {
    await openTerminalSession(
      options.terminal,
      session,
      options.terminalCommands,
    );
  }

  return session;
}

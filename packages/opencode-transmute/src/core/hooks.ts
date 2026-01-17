/**
 * Hooks System
 *
 * Declarative hooks for executing commands at lifecycle points.
 * Supports afterCreate (post-worktree setup) and beforeDestroy (cleanup).
 */

import { z } from "zod";

/**
 * Schema for hooks configuration
 */
export const hooksConfigSchema = z.object({
  /** Commands to run after worktree creation */
  afterCreate: z.array(z.string()).optional(),
  /** Commands to run before worktree destruction */
  beforeDestroy: z.array(z.string()).optional(),
});

/**
 * Hooks configuration type
 */
export type HooksConfig = z.infer<typeof hooksConfigSchema>;

/**
 * Result of a single hook execution
 */
export interface HookResult {
  /** The command that was executed */
  command: string;
  /** Whether the command succeeded */
  success: boolean;
  /** Standard output from the command */
  stdout: string;
  /** Standard error from the command */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Execution time in milliseconds */
  duration: number;
}

/**
 * Options for hook execution
 */
export interface ExecuteHooksOptions {
  /** Working directory for command execution */
  cwd: string;
  /** Stop execution on first error (default: true) */
  stopOnError?: boolean;
  /** Environment variables to pass to commands */
  env?: Record<string, string>;
}

/**
 * Execute a list of hooks sequentially
 *
 * @param commands - Array of shell commands to execute
 * @param options - Execution options
 * @returns Array of results for each command
 *
 * @example
 * ```ts
 * const results = await executeHooks(
 *   ["pnpm install", "pnpm build"],
 *   { cwd: "/path/to/worktree" }
 * )
 * ```
 */
export async function executeHooks(
  _commands: string[],
  _options: ExecuteHooksOptions,
): Promise<HookResult[]> {
  // TODO: Implement in Task 6 (oc-trans-006)
  // 1. Execute each command sequentially
  // 2. Capture stdout/stderr
  // 3. Stop on error if configured
  // 4. Return results array
  throw new Error("Not implemented - see Task oc-trans-006");
}

/**
 * Execute afterCreate hooks
 *
 * @param config - Hooks configuration
 * @param options - Execution options
 */
export async function executeAfterCreateHooks(
  config: HooksConfig,
  options: ExecuteHooksOptions,
): Promise<HookResult[]> {
  if (!config.afterCreate || config.afterCreate.length === 0) {
    return [];
  }
  return executeHooks(config.afterCreate, options);
}

/**
 * Execute beforeDestroy hooks
 *
 * @param config - Hooks configuration
 * @param options - Execution options
 */
export async function executeBeforeDestroyHooks(
  config: HooksConfig,
  options: ExecuteHooksOptions,
): Promise<HookResult[]> {
  if (!config.beforeDestroy || config.beforeDestroy.length === 0) {
    return [];
  }
  return executeHooks(config.beforeDestroy, options);
}

/**
 * Default hooks for common setups
 */
export const defaultHooks: HooksConfig = {
  afterCreate: [
    // Install dependencies if package.json exists
    "[ -f package.json ] && pnpm install || true",
  ],
  beforeDestroy: [],
};

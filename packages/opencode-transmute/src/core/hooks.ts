/**
 * Hooks System
 *
 * Declarative hooks for executing commands at lifecycle points.
 * Supports afterCreate (post-worktree setup) and beforeDestroy (cleanup).
 */

import { z } from "zod";
import { spawn } from "node:child_process";

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
 * Internal options for spawning a command
 */
interface SpawnCommandOptions {
  cwd: string;
  env?: Record<string, string>;
}

/**
 * Execute a single shell command
 *
 * @param command - Shell command to execute
 * @param options - Spawn options
 * @returns Hook result with stdout, stderr, exitCode, and duration
 */
async function executeCommand(
  command: string,
  options: SpawnCommandOptions,
): Promise<HookResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const proc = spawn("sh", ["-c", command], {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
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
      const duration = Date.now() - startTime;
      resolve({
        command,
        success: false,
        stdout,
        stderr: err.message,
        exitCode: -1,
        duration,
      });
    });

    proc.on("close", (code) => {
      const exitCode = code ?? 0;
      const duration = Date.now() - startTime;
      resolve({
        command,
        success: exitCode === 0,
        stdout,
        stderr,
        exitCode,
        duration,
      });
    });
  });
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
 * // Strict mode (default) - stops on first error
 * const results = await executeHooks(
 *   ["pnpm install", "pnpm build"],
 *   { cwd: "/path/to/worktree" }
 * )
 *
 * // Lenient mode - continues after errors
 * const results = await executeHooks(
 *   ["pnpm install", "pnpm build"],
 *   { cwd: "/path/to/worktree", stopOnError: false }
 * )
 * ```
 */
export async function executeHooks(
  commands: string[],
  options: ExecuteHooksOptions,
): Promise<HookResult[]> {
  const { cwd, stopOnError = true, env } = options;
  const results: HookResult[] = [];

  for (const command of commands) {
    const result = await executeCommand(command, { cwd, env });
    results.push(result);

    // Stop on first error if stopOnError is true
    if (!result.success && stopOnError) {
      break;
    }
  }

  return results;
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

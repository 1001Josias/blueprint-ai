/**
 * OpenCode Transmute Plugin
 *
 * A plugin for task-based development with git worktrees.
 * Creates isolated environments for each task with AI-generated branch names.
 *
 * For programmatic use of utility functions, import from 'opencode-transmute/utils'
 */

import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { type OpenCodeClient } from "./core/naming";
import { startTask } from "./tools/start-task";
import { createWezTermAdapter } from "./adapters/terminal/wezterm";
import { getGitRoot } from "./core/exec";
import { loadConfig, getHooksConfig, type Config } from "./core/config";

// Re-export types and functions for programmatic use
export * from "./core/naming";
export * from "./core/worktree";
export * from "./core/session";
export * from "./core/hooks";
export * from "./core/errors";
export * from "./core/exec";
export * from "./core/config";
export * from "./adapters/terminal/types";
export * from "./tools/start-task";

/**
 * Create terminal adapter based on configuration
 */
function createTerminalAdapter(config: Config) {
  switch (config.terminal) {
    case "wezterm":
      return createWezTermAdapter();
    case "none":
      return undefined;
    // TODO: Add support for tmux and kitty
    default:
      return createWezTermAdapter();
  }
}

/**
 * Main Transmute Plugin
 *
 * Provides tools for:
 * - Creating isolated git worktrees for tasks
 * - AI-generated branch naming
 * - Session persistence across restarts
 * - Terminal integration (WezTerm)
 */
export const TransmutePlugin: Plugin = async (ctx: PluginInput) => {
  // Extract client for AI operations
  const client = ctx.client as unknown as OpenCodeClient;

  // Get repository root
  const basePath = await getGitRoot();

  // Load configuration
  const { config, source, configPath } = await loadConfig(basePath);

  // Log configuration source (for debugging)
  if (configPath) {
    console.log(`[transmute] Loaded config from: ${configPath}`);
  } else {
    console.log(`[transmute] Using default configuration`);
  }

  // Create terminal adapter based on config
  const terminal = createTerminalAdapter(config);

  // Get hooks configuration
  const hooks = getHooksConfig(config);

  return {
    // Custom tools available to the LLM
    tool: {
      "start-task": tool({
        description:
          "Create an isolated git worktree for a task with AI-generated branch name. " +
          "Use this when starting work on a new task to ensure clean separation from other work. " +
          "If a session already exists for the task, it will resume the existing worktree.",
        args: {
          taskId: tool.schema
            .string()
            .describe("Unique task identifier (e.g., task-123)"),
          title: tool.schema
            .string()
            .describe("Task title for branch name generation"),
          description: tool.schema
            .string()
            .optional()
            .describe("Task description for better branch name inference"),
          priority: tool.schema
            .string()
            .optional()
            .describe("Task priority (low, medium, high, critical)"),
          type: tool.schema
            .string()
            .optional()
            .describe(
              "Branch type hint: feat, fix, refactor, docs, chore, test",
            ),
          baseBranch: tool.schema
            .string()
            .optional()
            .describe(
              `Base branch to create worktree from (default: ${config.defaultBaseBranch})`,
            ),
        },
        async execute(args, context) {
          // Execute the full start-task flow
          const result = await startTask(
            {
              taskId: args.taskId,
              title: args.title,
              description: args.description,
              priority: args.priority,
              type: args.type,
              baseBranch: args.baseBranch || config.defaultBaseBranch,
            },
            basePath,
            {
              client: config.useAiBranchNaming ? client : undefined,
              opencodeSessionId: context.sessionID,
              terminal,
              openTerminal: config.autoOpenTerminal,
              runHooks: config.autoRunHooks,
              hooks,
            },
          );

          return JSON.stringify({
            status: result.status,
            message:
              result.status === "created"
                ? `Created new worktree for task: ${result.taskId}`
                : `Resumed existing worktree for task: ${result.taskId}`,
            taskId: result.taskId,
            taskName: result.taskName,
            branch: result.branch,
            worktreePath: result.worktreePath,
            opencodeSessionId: result.opencodeSessionId,
            configSource: source,
          });
        },
      }),
    },

    // Event hooks (to be implemented in future tasks)
    // event: async ({ event }) => {
    //   // Handle session events, file changes, etc.
    // },
  };
};

// Default export for OpenCode plugin loading
export default TransmutePlugin;

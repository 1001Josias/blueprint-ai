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

// NOTE: Named exports removed to avoid "mixed exports" bundler warning.
// The plugin only exports the default TransmutePlugin function.
// For programmatic use of utilities, import directly from submodules.

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
const TransmutePlugin: Plugin = async (ctx: PluginInput) => {
  // Extract client for AI operations
  const client = ctx.client as unknown as OpenCodeClient;

  // Initialize with safe defaults
  let basePath: string;
  let config: Config;
  let source: string;
  let configPath: string | undefined;

  try {
    // Get repository root
    basePath = await getGitRoot();

    // Load configuration
    const loadResult = await loadConfig(basePath);
    config = loadResult.config;
    source = loadResult.source;
    configPath = loadResult.configPath;

    // Log configuration source (for debugging)
    if (configPath) {
      console.log(`[transmute] Loaded config from: ${configPath}`);
    } else {
      console.log(`[transmute] Using default configuration`);
    }
  } catch (error) {
    console.error(`[transmute] Plugin initialization failed:`, error);
    // Return empty plugin if init fails - tools won't be available
    return {};
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
          try {
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

            // Build appropriate message based on status
            let message: string;
            if (result.status === "created") {
              message = `Created new worktree for task: ${result.taskId}`;
            } else if (result.status === "existing") {
              message = `Resumed existing worktree for task: ${result.taskId}`;
            } else {
              message = result.message || `Failed to start task: ${result.taskId}`;
            }

            return JSON.stringify({
              status: result.status,
              message,
              taskId: result.taskId,
              taskName: result.taskName,
              branch: result.branch,
              worktreePath: result.worktreePath,
              opencodeSessionId: result.opencodeSessionId,
              configSource: source,
            });
          } catch (error) {
            // Catch any unhandled errors and log to console instead of crashing
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[opencode-transmute] Unhandled error in start-task:`, error);
            
            return JSON.stringify({
              status: "failed",
              message: `Error: ${errorMessage}`,
              taskId: args.taskId || "unknown",
            });
          }
        },
      }),
    },

    // Event hooks (to be implemented in future tasks)
    // event: async ({ event }) => {
    //   // Handle session events, file changes, etc.
    // },
  };
};

// Named export for consumers that import { TransmutePlugin }
export { TransmutePlugin };

// Default export for OpenCode plugin loading
export default TransmutePlugin;

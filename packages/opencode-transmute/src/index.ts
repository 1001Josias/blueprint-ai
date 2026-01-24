/**
 * OpenCode Transmute Plugin
 *
 * A plugin for task-based development with git worktrees.
 * Creates isolated environments for each task with AI-generated branch names.
 */

import type { Plugin, PluginInput } from "@opencode-ai/plugin";

// Re-export types and functions for programmatic use
export * from "./core/naming";
export * from "./core/worktree";
export * from "./core/session";
export * from "./core/hooks";
export * from "./core/errors";
export * from "./core/exec";
export * from "./adapters/terminal/types";
export * from "./tools/start-task";

/**
 * Main Transmute Plugin
 *
 * Provides tools for:
 * - Creating isolated git worktrees for tasks
 * - AI-generated branch naming (via @branch-namer subagent)
 * - Session persistence across restarts
 * - Terminal integration (WezTerm)
 *
 * Tools are registered via the .opencode/agents directory.
 * The start-task workflow is orchestrated by agents, not tools directly.
 */
export const TransmutePlugin: Plugin = async (_ctx: PluginInput) => {
  return {
    // Tools will be implemented in future tasks (oc-trans-007)
    // For now, we rely on the @branch-namer subagent for branch naming
    // and the startTask function can be called programmatically
    tool: {},

    // Event hooks (to be implemented in future tasks)
    // event: async ({ event }) => {
    //   // Handle session events, file changes, etc.
    // },
  };
};

// Default export for OpenCode plugin loading
export default TransmutePlugin;

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
import * as createWorkspace from "./tools/create-workspace";

export * from "./tools/create-workspace";

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
    tool: {
      createWorkspace: {
        description: "Create or resume an isolated task workspace",
        inputSchema: createWorkspace.createWorkspaceInputSchema,
        outputSchema: createWorkspace.createWorkspaceOutputSchema,
        handler: async (input: createWorkspace.CreateWorkspaceInput, options?: any) => {
            return await createWorkspace.createWorkspace(input, undefined, options);
        },
      },
    },

    // Event hooks (to be implemented in future tasks)
    // event: async ({ event }) => {
    //   // Handle session events, file changes, etc.
    // },
  };
};

// Default export for OpenCode plugin loading
export default TransmutePlugin;

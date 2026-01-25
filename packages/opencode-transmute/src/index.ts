/**
 * OpenCode Transmute Plugin
 *
 * A plugin for task-based development with git worktrees.
 * Creates isolated environments for each task with AI-generated branch names.
 */

import type { Plugin } from "@opencode-ai/plugin";

// Re-export types and functions for programmatic use
export * from "./core/naming";
export * from "./core/worktree";
export * from "./core/session";
export * from "./core/hooks";
export * from "./core/config";
export * from "./core/errors";
export * from "./core/exec";
export * from "./core/tasks";
export * from "./adapters/terminal/types";

import * as createWorkspaceTool from "./tools/create-workspace";
import * as findTasksTool from "./tools/find-tasks";
import * as cleanWorkspacesTool from "./tools/clean-workspaces";
import * as setupAgentsTool from "./tools/setup-agents";
import * as listSessionsTool from "./tools/list-sessions";


export * from "./tools/create-workspace";
export * from "./tools/find-tasks";
export * from "./tools/clean-workspaces";
export * from "./tools/clean-workspaces";
export * from "./tools/setup-agents";
export * from "./tools/list-sessions";

/**
 * Main Transmute Plugin
 *
 * Provides tools for:
 * - Creating isolated git worktrees for tasks
 * - AI-generated branch naming (via @branch-namer subagent)
 * - Session persistence across restarts
 * - Terminal integration (WezTerm)
 * - Listing tasks
 * - Cleaning workspaces
 * - Setting up (installing) agents
 *
 * Tools are registered via the .opencode/agents directory.
 * The start-task workflow is orchestrated by agents, not tools directly.
 */
import { tool } from "@opencode-ai/plugin";

export const TransmutePlugin: Plugin = async () => {
  // Auto-setup: Attempt to install agents and config in background
  // We use setTimeout to not block the plugin initialization
  setTimeout(() => {
    // Determine .opencode directory location
    setupAgentsTool.setupAgents({ overwrite: false, createConfig: true })
        .catch(err => {
            // Validate if error is "Could not locate source agents directory" which is expected in some envs
            // Only log if it's unexpected
            if (!err.message?.includes("Could not locate source agents")) {
                 console.warn("[transmute] Auto-setup failed:", err);
            }
        });
  }, 1000);

  return {
    tool: {
      create_workspace: tool({
        description: "Create or resume an isolated task workspace",
        // Extract the Zod shape from the schema
        args: createWorkspaceTool.createWorkspaceInputSchema.shape, 
        execute: async (input, context) => {
            // Note: input is inferred as the object keys, which matches CreateWorkspaceInput
            const safeOptions = {
                // ...options? context?
                // The tool execute receives (args, context). 
                // context has sessionID.
                opencodeSessionId: context.sessionID
            };
            const result = await createWorkspaceTool.createWorkspace(input, undefined, safeOptions);
            return JSON.stringify(result);
        },
      }),
      find_tasks: tool({
          description: "Find and list tasks from the project",
          args: findTasksTool.findTasksInputSchema.shape,
          execute: async (input) => {
              const result = await findTasksTool.findTasks(input);
              return JSON.stringify(result);
          }
      }),
      clean_workspaces: tool({
          description: "Clean up old or orphaned worktrees",
          args: cleanWorkspacesTool.cleanWorkspacesInputSchema.shape,
          execute: async (input) => {
              const result = await cleanWorkspacesTool.cleanWorkspaces(input);
              return JSON.stringify(result);
          }
      }),
      setup_agents: tool({
          description: "Install Transmute agents to your project",
          args: setupAgentsTool.setupAgentsInputSchema.shape,
          execute: async (input) => {
              const result = await setupAgentsTool.setupAgents(input);
              return JSON.stringify(result);
          }
      }),
      list_sessions: tool({
          description: "List active sessions and worktrees",
          args: listSessionsTool.listSessionsInputSchema.shape,
          execute: async (input) => {
              const result = await listSessionsTool.listSessions(input);
              return JSON.stringify(result);
          }
      })
    },
  };
};

export default TransmutePlugin;

/**
 * OpenCode Transmute Plugin
 *
 * A plugin for task-based development with git worktrees.
 * Creates isolated environments for each task with AI-generated branch names.
 */

import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { generateBranchName, type OpenCodeClient } from "./core/naming";

// Re-export types and functions for programmatic use
export * from "./core/naming";
export * from "./core/worktree";
export * from "./core/session";
export * from "./core/hooks";
export * from "./core/errors";
export * from "./core/exec";
export * from "./adapters/terminal/types";

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
  // Cast to our simplified OpenCodeClient interface
  const client = ctx.client as unknown as OpenCodeClient;

  return {
    // Custom tools available to the LLM
    tool: {
      "start-task": tool({
        description:
          "Create an isolated git worktree for a task with AI-generated branch name. " +
          "Use this when starting work on a new task to ensure clean separation from other work.",
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
            .describe("Base branch to create worktree from (default: main)"),
        },
        async execute(args, context) {
          // Generate branch name using AI (or fallback)
          const branchResult = await generateBranchName(
            {
              id: args.taskId,
              title: args.title,
              description: args.description,
              priority: args.priority,
              type: args.type,
            },
            client,
            context.sessionID,
          );

          // TODO: Implement full flow in Task 7 (oc-trans-007)
          // 1. Check if session exists for taskId
          // 2. If exists, return existing worktree
          // 3. Create worktree with generated branch name
          // 4. Persist session
          // 5. Open terminal in worktree
          // 6. Execute afterCreate hooks
          // 7. Return result

          return JSON.stringify({
            status: "placeholder",
            message: `Would create worktree for task: ${args.taskId}`,
            taskId: args.taskId,
            title: args.title,
            branch: branchResult.branch,
            branchType: branchResult.type,
            branchSlug: branchResult.slug,
            baseBranch: args.baseBranch || "main",
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

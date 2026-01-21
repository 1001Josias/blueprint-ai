/**
 * OpenCode Transmute Plugin
 *
 * A plugin for task-based development with git worktrees.
 * Creates isolated environments for each task with AI-generated branch names.
 */

import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { generateBranchName } from "./core/naming";

// Re-export types and functions for programmatic use
export * from "./core/naming";
export * from "./core/worktree";
export * from "./core/session";
export * from "./core/hooks";
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


  return {
    // Custom tools available to the LLM
    tool: {
      "start-task": tool({
        description:
          "Create an isolated git worktree for a task. " +
          "BEFORE calling this tool, use @branch-namer to generate the branchType and branchSlug, " +
          "then pass them here. Example: first ask '@branch-namer Task: oc-trans-002 - AI Branch Naming', " +
          "then call start-task with the generated branchType and branchSlug.",
        args: {
          taskId: tool.schema
            .string()
            .describe("Unique task identifier (e.g., task-123)"),
          title: tool.schema
            .string()
            .describe("Task title"),
          description: tool.schema
            .string()
            .optional()
            .describe("Task description"),
          branchType: tool.schema
            .string()
            .optional()
            .describe("Branch type from @branch-namer: feat, fix, refactor, docs, chore, or test"),
          branchSlug: tool.schema
            .string()
            .optional()
            .describe("Branch slug from @branch-namer (e.g., oc-trans-002-ai-branch-naming)"),
          baseBranch: tool.schema
            .string()
            .optional()
            .describe("Base branch to create worktree from (default: main)"),
        },
        async execute(args) {
          // Use subagent-provided branch name or fallback to deterministic
          const branchName = args.branchType && args.branchSlug
            ? {
                type: args.branchType as "feat" | "fix" | "refactor" | "docs" | "chore" | "test",
                slug: args.branchSlug,
              }
            : undefined;

          const branchResult = generateBranchName(
            {
              id: args.taskId,
              title: args.title,
              description: args.description,
              priority: args.priority,
              type: args.type,
            },
            branchName,
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

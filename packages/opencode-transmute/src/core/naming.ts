/**
 * AI Branch Naming
 *
 * Generates intelligent branch names based on task context using AI.
 * Falls back to deterministic naming if AI is unavailable.
 */

import { z } from "zod";

/**
 * Context provided to the branch name generator
 */
export interface TaskContext {
  /** Unique task identifier */
  id: string;
  /** Task title - primary source for branch name */
  title: string;
  /** Optional description for better context */
  description?: string;
  /** Task priority level */
  priority?: string;
  /** Optional hint for branch type (feat, fix, refactor, etc.) */
  type?: string;
}

/**
 * Result of branch name generation
 */
export interface BranchNameResult {
  /** Full branch name (e.g., "feat/implement-oauth-google-login") */
  branch: string;
  /** Inferred or provided branch type */
  type: BranchType;
  /** The slug portion of the branch name */
  slug: string;
}

/**
 * Valid branch types following conventional commits
 */
export const branchTypes = [
  "feat",
  "fix",
  "refactor",
  "docs",
  "chore",
  "test",
] as const;
export type BranchType = (typeof branchTypes)[number];

export const branchTypeSchema = z.enum(branchTypes);

export const taskContextSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.string().optional(),
  type: branchTypeSchema.optional(),
});

export const branchNameResultSchema = z.object({
  branch: z.string(),
  type: branchTypeSchema,
  slug: z.string(),
});

/**
 * Generate a branch name using AI inference
 *
 * @param context - Task context for generating the branch name
 * @returns Branch name result with type and slug
 *
 * @example
 * ```ts
 * const result = await generateBranchName({
 *   id: "task-123",
 *   title: "Add Google OAuth login",
 *   description: "Users should be able to sign in with their Google account"
 * })
 * // result: { branch: "feat/add-google-oauth-login", type: "feat", slug: "add-google-oauth-login" }
 * ```
 */
export async function generateBranchName(
  context: TaskContext,
): Promise<BranchNameResult> {
  // Validate input
  taskContextSchema.parse(context);

  // TODO: Implement AI-powered branch name generation in Task 2 (oc-trans-002)
  // For now, use fallback
  return generateFallbackBranchName(context);
}

/**
 * Generate a deterministic fallback branch name
 *
 * Used when AI is unavailable or fails.
 * Format: <type>/<task-id>-<slugified-title>
 */
export function generateFallbackBranchName(
  context: TaskContext,
): BranchNameResult {
  const type: BranchType =
    context.type && branchTypes.includes(context.type as BranchType)
      ? (context.type as BranchType)
      : "feat";

  // Slugify the title
  const slug = slugify(`${context.id}-${context.title}`);

  return {
    branch: `${type}/${slug}`,
    type,
    slug,
  };
}

/**
 * Sanitize and validate a branch name
 *
 * Ensures the branch name:
 * - Is lowercase
 * - Contains no invalid git characters
 * - Does not exceed max length
 * - Has format <type>/<slug>
 */
export function sanitizeBranchName(name: string, maxLength = 50): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-/]/g, "-") // Replace invalid chars with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, maxLength);
}

/**
 * Convert a string to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

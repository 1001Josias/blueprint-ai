/**
 * AI Branch Naming
 *
 * Generates intelligent branch names based on task context using AI.
 * Falls back to deterministic naming if AI is unavailable.
 */

import { z } from "zod";

/**
 * Simplified OpenCode SDK client interface for branch name generation.
 * Only includes the session.prompt method needed for AI inference.
 */


/**
 * Prompt template for AI branch name generation.
 * Uses structured output to get consistent JSON responses.
 */


/**
 * Schema for validating AI response
 */


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
 * @param client - Optional OpenCode client for AI inference
 * @param sessionId - Session ID for the AI prompt
 * @returns Branch name result with type and slug
 *
 * @example
 * ```ts
 * const result = await generateBranchName({
 *   id: "task-123",
 *   title: "Add Google OAuth login",
 *   description: "Users should be able to sign in with their Google account"
 * }, client, sessionId)
 * // result: { branch: "feat/add-google-oauth-login", type: "feat", slug: "add-google-oauth-login" }
 * ```
 */
/**
 * Generate a branch name from agent-provided values or fallback to deterministic
 *
 * @param context - Task context
 * @param branchName - Optional pre-generated branch name from agent (type + slug)
 * @returns Branch name result
 *
 * @example
 * ```ts
 * // Agent provides the branch name
 * const result = generateBranchName(
 *   { id: "task-123", title: "Add OAuth" },
 *   { type: "feat", slug: "add-google-oauth-login" }
 * )
 * // result: { branch: "feat/add-google-oauth-login", type: "feat", slug: "add-google-oauth-login" }
 *
 * // Or fallback to deterministic
 * const result = generateBranchName({ id: "task-123", title: "Add OAuth" })
 * // result: { branch: "feat/task-123-add-oauth", type: "feat", slug: "task-123-add-oauth" }
 * ```
 */
export function generateBranchName(
  context: TaskContext,
  branchName?: { type: BranchType; slug: string },
): BranchNameResult {
  // Validate input
  taskContextSchema.parse(context);

  // If agent provided branch name, use it
  if (branchName) {
    try {
      const sanitizedSlug = sanitizeBranchName(branchName.slug, 40);
      return {
        branch: `${branchName.type}/${sanitizedSlug}`,
        type: branchName.type,
        slug: sanitizedSlug,
      };
    } catch (error) {
      console.warn(
        "[transmute] Invalid branch name provided, using fallback:",
        error,
      );
    }
  }

  // Fallback to deterministic naming
  return generateFallbackBranchName(context);
}

/**
 * Generate a branch name using AI inference
 *
 * @param context - Task context
 * @param client - OpenCode client for AI inference
 * @param sessionId - Session ID for the AI prompt
 * @returns Branch name result
 * @throws Error if AI call fails (caller should handle fallback)
 */


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

  // Remove the task ID from the title if it appears at the start to avoid duplication
  // e.g., title "oc-trans-002 - AI Branch Naming" with id "oc-trans-002" would otherwise
  // produce "oc-trans-002-oc-trans-002-ai-branch-naming"
  const normalizedId = context.id.toLowerCase();
  const normalizedTitle = context.title.toLowerCase();
  let cleanTitle = context.title;

  // Check if title starts with the ID (with optional separator like " - " or ": ")
  if (normalizedTitle.startsWith(normalizedId)) {
    cleanTitle = context.title.slice(context.id.length).replace(/^[\s\-:]+/, "");
  }

  // Slugify the title
  const slug = slugify(`${context.id}-${cleanTitle}`);

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

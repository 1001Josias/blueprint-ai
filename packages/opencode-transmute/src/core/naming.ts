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
export interface OpenCodeClient {
  session: {
    prompt(options: {
      path: { id: string };
      body: {
        parts: Array<{ type: "text"; text: string }>;
        assistant?: { prefill?: string };
      };
    }): Promise<{
      parts?: Array<{ type: string; text?: string }>;
    }>;
  };
}

/**
 * Prompt template for AI branch name generation.
 * Uses structured output to get consistent JSON responses.
 */
const BRANCH_NAME_PROMPT = `You are a git branch name generator. Analyze the task and generate an appropriate branch name.

Task Information:
- ID: {id}
- Title: {title}
- Description: {description}

Generate a branch name following these rules:
1. Infer the type from context:
   - feat: new features, additions
   - fix: bug fixes, corrections
   - refactor: code restructuring without changing behavior
   - docs: documentation changes
   - chore: maintenance, dependencies, config
   - test: test additions or modifications
2. Create a concise, descriptive slug (max 40 characters)
3. Use lowercase letters, numbers, and hyphens only
4. No spaces, underscores, or special characters

Respond with ONLY valid JSON in this format, no explanation:
{"type": "feat|fix|refactor|docs|chore|test", "slug": "descriptive-slug-here"}`;

/**
 * Schema for validating AI response
 */
const branchAIResponseSchema = z.object({
  type: z.enum(["feat", "fix", "refactor", "docs", "chore", "test"]),
  slug: z.string().min(1).max(60),
});

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
export async function generateBranchName(
  context: TaskContext,
  client?: OpenCodeClient,
  sessionId?: string,
): Promise<BranchNameResult> {
  // Validate input
  taskContextSchema.parse(context);

  // If client and sessionId provided, try AI generation
  if (client && sessionId) {
    try {
      return await generateBranchNameWithAI(context, client, sessionId);
    } catch (error) {
      console.warn(
        "[transmute] AI branch naming failed, using fallback:",
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
export async function generateBranchNameWithAI(
  context: TaskContext,
  client: OpenCodeClient,
  sessionId: string,
): Promise<BranchNameResult> {
  // Build the prompt with task context
  const prompt = BRANCH_NAME_PROMPT.replace("{id}", context.id)
    .replace("{title}", context.title)
    .replace("{description}", context.description || "No description provided");

  // Call the AI via OpenCode client
  const response = await client.session.prompt({
    path: { id: sessionId },
    body: {
      parts: [{ type: "text", text: prompt }],
      // Prefill helps the AI respond with JSON directly
      assistant: { prefill: '{"type":"' },
    },
  });

  // Extract text from response
  const textPart = response.parts?.find((p) => p.type === "text");
  if (!textPart?.text) {
    throw new Error("No text response from AI");
  }

  // Try to extract JSON from the response
  // The response might be:
  // 1. A complete JSON object: {"type": "feat", "slug": "..."}
  // 2. A continuation after prefill: feat", "slug": "..."} (when prefill is '{"type":"')
  // 3. Wrapped in markdown: ```json\n{...}\n```

  let jsonStr = textPart.text.trim();

  // First, try to find a complete JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  } else {
    // No complete JSON found - might be a prefill continuation
    // Try to reconstruct by prepending the prefill
    jsonStr = '{"type":"' + jsonStr;
    // Clean up potential double quotes or malformed JSON
    jsonStr = jsonStr.replace(/""+/g, '"');
  }

  // Parse and validate with Zod
  const parsed = JSON.parse(jsonStr);
  const validated = branchAIResponseSchema.parse(parsed);

  // Sanitize the slug
  const sanitizedSlug = sanitizeBranchName(validated.slug, 40);

  return {
    branch: `${validated.type}/${sanitizedSlug}`,
    type: validated.type,
    slug: sanitizedSlug,
  };
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

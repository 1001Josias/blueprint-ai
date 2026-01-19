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
  app: {
    log(options: {
      body: {
        service?: string;
        level: "debug" | "info" | "warn" | "error";
        message: string;
        extra?: Record<string, unknown>;
      };
    }): Promise<void>;
  };
  session: {
    create(options?: {
      body?: {
        workspace?: string;
        project?: string;
      };
    }): Promise<{ id: string }>;
    delete(options: { path: { id: string } }): Promise<void>;
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
  // Accept any string for type - we'll validate/default in the functions
  type: z.string().optional(),
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
  // Validate input using safeParse to avoid throwing
  const validated = taskContextSchema.safeParse(context);
  if (!validated.success) {
    // Log validation error and use fallback with raw context
    if (client?.app) {
      await client.app.log({
        body: {
          service: "opencode-transmute",
          level: "warn",
          message: `Task context validation failed: ${validated.error.message}. Using fallback.`,
        },
      });
    }
    console.error(`[opencode-transmute] Task context validation failed:`, validated.error);
    // Use fallback with the raw context (best effort)
    return generateFallbackBranchName(context);
  }

  // If client and sessionId provided, try AI generation
  // NOTE: sessionId must start with "ses" for OpenCode SDK validation
  if (client && sessionId && sessionId.startsWith("ses")) {
    try {
      // Log that we're attempting AI generation
      if (client.app) {
        await client.app.log({
          body: {
            service: "opencode-transmute",
            level: "debug",
            message: `Attempting AI branch name generation for task: ${context.id}`,
          },
        });
      }
      return await generateBranchNameWithAI(context, client, sessionId);
    } catch (error) {
      console.error(`[opencode-transmute] AI branch naming failed:`, error);
      
      if (client.app) {
        await client.app.log({
          body: {
            service: "opencode-transmute",
            level: "warn",
            message: `AI branch naming failed, using fallback: ${(error as Error).message}`,
          },
        });
      }
    }
  } else if (client?.app) {
    // Log why we're using fallback
    await client.app.log({
      body: {
        service: "opencode-transmute",
        level: "debug",
        message: `Using fallback branch naming. client: ${!!client}, sessionId: ${sessionId}, startsWith-ses: ${sessionId?.startsWith("ses")}`,
      },
    });
  }

  // Fallback to deterministic naming
  return generateFallbackBranchName(context);
}

/**
 * Generate a branch name using AI inference
 *
 * Creates an isolated ephemeral session to avoid blocking the user's
 * conversation queue. The session is deleted after use.
 *
 * @param context - Task context
 * @param client - OpenCode client for AI inference
 * @param _sessionId - Original session ID (unused, kept for API compatibility)
 * @returns Branch name result
 * @throws Error if AI call fails (caller should handle fallback)
 */
export async function generateBranchNameWithAI(
  context: TaskContext,
  client: OpenCodeClient,
  _sessionId: string,
): Promise<BranchNameResult> {
  let ephemeralSessionId: string | undefined;

  try {
    // Create an ephemeral session for AI branch naming
    // This avoids blocking the user's main conversation queue
    await client.app.log({
      body: {
        service: "opencode-transmute",
        level: "debug",
        message: "Creating ephemeral session for AI branch naming...",
      },
    });

    const ephemeralSession = await client.session.create({});
    ephemeralSessionId = ephemeralSession.id;

    await client.app.log({
      body: {
        service: "opencode-transmute",
        level: "debug",
        message: `Ephemeral session created: ${ephemeralSessionId}`,
      },
    });

    // Build the prompt with task context
    const prompt = BRANCH_NAME_PROMPT.replace("{id}", context.id)
      .replace("{title}", context.title)
      .replace(
        "{description}",
        context.description || "No description provided",
      );

    // Call the AI via OpenCode client using the ephemeral session
    const response = await client.session.prompt({
      path: { id: ephemeralSessionId },
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
    let jsonStr = textPart.text.trim();

    // First, try to find a complete JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      // No complete JSON found - might be a prefill continuation
      jsonStr = '{"type":"' + jsonStr;
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
  } catch (error) {
    // Log and re-throw - caller (generateBranchName) will catch and use fallback
    console.error(`[opencode-transmute] AI branch naming error:`, error);
    throw error;
  } finally {
    // Always clean up the ephemeral session if it was created
    if (ephemeralSessionId) {
      try {
        await client.session.delete({ path: { id: ephemeralSessionId } });
      } catch {
        // Ignore cleanup errors - session might already be expired
      }
    }
  }
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

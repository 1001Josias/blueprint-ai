/**
 * Session Persistence
 *
 * Manages state persistence for transmute sessions.
 * Sessions track the mapping between tasks and their worktrees,
 * with a mandatory link to OpenCode sessions for conversation continuity.
 */

import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Schema for a single session
 */
export const sessionSchema = z.object({
  /** Task identifier */
  taskId: z.string(),
  /** Human-readable task name */
  taskName: z.string(),
  /** Git branch name */
  branch: z.string(),
  /** Absolute path to the worktree */
  worktreePath: z.string(),
  /** ISO timestamp of session creation */
  createdAt: z.string().datetime(),
  /** OpenCode session ID for conversation continuity */
  opencodeSessionId: z.string(),
});

/**
 * A session representing a task-worktree mapping
 */
export interface Session {
  /** Task identifier */
  taskId: string;
  /** Human-readable task name */
  taskName: string;
  /** Git branch name */
  branch: string;
  /** Absolute path to the worktree */
  worktreePath: string;
  /** ISO timestamp of session creation */
  createdAt: string;
  /** OpenCode session ID for conversation continuity */
  opencodeSessionId: string;
}

/**
 * Schema for the complete state file
 */
export const stateSchema = z.object({
  sessions: z.array(sessionSchema),
});

/**
 * Complete state containing all sessions
 */
export interface State {
  sessions: Session[];
}

/**
 * Default state file path relative to repository root
 */
export const STATE_FILE_PATH = ".opencode/transmute.sessions.json";

/**
 * Get the full path to the state file
 */
export function getStateFilePath(basePath: string): string {
  return path.join(basePath, STATE_FILE_PATH);
}

/**
 * Get the directory containing the state file
 */
export function getStateDir(basePath: string): string {
  return path.join(basePath, ".opencode");
}

/**
 * Load the current state from disk
 *
 * @param basePath - Repository root path
 * @returns Current state with sessions
 * @throws ZodError if file exists but contains invalid data
 *
 * @example
 * ```ts
 * const state = await loadState("/path/to/repo")
 * console.log(state.sessions)
 * ```
 */
export async function loadState(basePath: string): Promise<State> {
  const filePath = getStateFilePath(basePath);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    return stateSchema.parse(data);
  } catch (error) {
    // Return empty state if file doesn't exist
    if (isNodeError(error) && error.code === "ENOENT") {
      return createEmptyState();
    }

    // Re-throw JSON parse errors with more context
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in state file: ${filePath}`);
    }

    // Re-throw other errors (including Zod validation errors)
    throw error;
  }
}

/**
 * Save state to disk
 *
 * @param basePath - Repository root path
 * @param state - State to save
 *
 * @example
 * ```ts
 * await saveState("/path/to/repo", { sessions: [...] })
 * ```
 */
export async function saveState(basePath: string, state: State): Promise<void> {
  // Validate state before saving
  const validatedState = stateSchema.parse(state);

  const stateDir = getStateDir(basePath);
  const filePath = getStateFilePath(basePath);

  // Create .opencode directory if it doesn't exist
  await fs.mkdir(stateDir, { recursive: true });

  // Write formatted JSON
  const content = JSON.stringify(validatedState, null, 2);
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Add a new session to state
 *
 * If a session with the same taskId already exists, it will be replaced.
 *
 * @param basePath - Repository root path
 * @param session - Session to add
 */
export async function addSession(
  basePath: string,
  session: Session,
): Promise<void> {
  // Validate the session
  const validatedSession = sessionSchema.parse(session);

  const state = await loadState(basePath);

  // Check if session with same taskId already exists
  const existingIndex = state.sessions.findIndex(
    (s) => s.taskId === validatedSession.taskId,
  );

  if (existingIndex >= 0) {
    // Replace existing session
    state.sessions[existingIndex] = validatedSession;
  } else {
    // Add new session
    state.sessions.push(validatedSession);
  }

  await saveState(basePath, state);
}

/**
 * Remove a session from state
 *
 * If the session doesn't exist, this is a no-op.
 *
 * @param basePath - Repository root path
 * @param taskId - Task ID to remove
 */
export async function removeSession(
  basePath: string,
  taskId: string,
): Promise<void> {
  const state = await loadState(basePath);

  // Filter out the session with matching taskId
  state.sessions = state.sessions.filter((s) => s.taskId !== taskId);

  await saveState(basePath, state);
}

/**
 * Find an existing session by task ID
 *
 * @param basePath - Repository root path
 * @param taskId - Task ID to find
 * @returns Session if found, undefined otherwise
 */
export async function findSessionByTask(
  basePath: string,
  taskId: string,
): Promise<Session | undefined> {
  const state = await loadState(basePath);
  return state.sessions.find((s) => s.taskId === taskId);
}

/**
 * Create an empty state object
 */
export function createEmptyState(): State {
  return { sessions: [] };
}

/**
 * Type guard for Node.js errors with code property
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

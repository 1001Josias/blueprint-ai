/**
 * Session Persistence
 *
 * Manages state persistence for transmute sessions.
 * Sessions track the mapping between tasks and their worktrees.
 */

import { z } from "zod";

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
});

/**
 * Schema for the complete state file
 */
export const stateSchema = z.object({
  sessions: z.array(sessionSchema),
});

/**
 * A session representing a task-worktree mapping
 */
export type Session = z.infer<typeof sessionSchema>;

/**
 * Complete state containing all sessions
 */
export type State = z.infer<typeof stateSchema>;

/**
 * Default state file path relative to repository root
 */
export const STATE_FILE_PATH = ".opencode/transmute.sessions.json";

/**
 * Load the current state from disk
 *
 * @param basePath - Repository root path
 * @returns Current state with sessions
 *
 * @example
 * ```ts
 * const state = await loadState("/path/to/repo")
 * console.log(state.sessions)
 * ```
 */
export async function loadState(_basePath: string): Promise<State> {
  // TODO: Implement in Task 4 (oc-trans-004)
  // 1. Read file from basePath/.opencode/transmute.sessions.json
  // 2. Return empty state if file doesn't exist
  // 3. Validate with Zod
  throw new Error("Not implemented - see Task oc-trans-004");
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
export async function saveState(
  _basePath: string,
  _state: State,
): Promise<void> {
  // TODO: Implement in Task 4 (oc-trans-004)
  // 1. Validate state with Zod
  // 2. Create .opencode directory if needed
  // 3. Write JSON file
  throw new Error("Not implemented - see Task oc-trans-004");
}

/**
 * Add a new session to state
 *
 * @param basePath - Repository root path
 * @param session - Session to add
 */
export async function addSession(
  _basePath: string,
  _session: Session,
): Promise<void> {
  // TODO: Implement in Task 4 (oc-trans-004)
  throw new Error("Not implemented - see Task oc-trans-004");
}

/**
 * Remove a session from state
 *
 * @param basePath - Repository root path
 * @param taskId - Task ID to remove
 */
export async function removeSession(
  _basePath: string,
  _taskId: string,
): Promise<void> {
  // TODO: Implement in Task 4 (oc-trans-004)
  throw new Error("Not implemented - see Task oc-trans-004");
}

/**
 * Find an existing session by task ID
 *
 * @param basePath - Repository root path
 * @param taskId - Task ID to find
 * @returns Session if found, undefined otherwise
 */
export async function findSessionByTask(
  _basePath: string,
  _taskId: string,
): Promise<Session | undefined> {
  // TODO: Implement in Task 4 (oc-trans-004)
  throw new Error("Not implemented - see Task oc-trans-004");
}

/**
 * Create an empty state object
 */
export function createEmptyState(): State {
  return { sessions: [] };
}

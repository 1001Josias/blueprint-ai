/**
 * Terminal Adapter Types
 *
 * Abstract interface for terminal integrations.
 * Allows different terminal emulators to be used interchangeably.
 */

/**
 * Options for opening a terminal session
 */
export interface OpenSessionOptions {
  /** Working directory for the terminal */
  cwd: string;
  /** Commands to execute on session start */
  commands?: string[];
  /** Title for the terminal tab/window */
  title?: string;
  /** Environment variables to set */
  env?: Record<string, string>;
}

/**
 * Abstract terminal adapter interface
 *
 * Implementations should handle terminal-specific details
 * for opening sessions, executing commands, etc.
 */
export interface TerminalAdapter {
  /** Adapter name (e.g., "wezterm", "tmux") */
  name: string;

  /**
   * Check if this terminal is available on the system
   *
   * @returns True if the terminal can be used
   */
  isAvailable(): Promise<boolean>;

  /**
   * Open a new terminal session
   *
   * @param options - Session options
   */
  openSession(options: OpenSessionOptions): Promise<void>;
}

/**
 * Result of terminal availability check
 */
export interface TerminalAvailability {
  /** Adapter name */
  name: string;
  /** Whether the terminal is available */
  available: boolean;
  /** Version if available */
  version?: string;
  /** Path to the executable */
  path?: string;
}

/**
 * Check availability of multiple terminal adapters
 *
 * @param adapters - Array of terminal adapters to check
 * @returns Availability status for each adapter
 */
export async function checkTerminalAvailability(
  adapters: TerminalAdapter[],
): Promise<TerminalAvailability[]> {
  return Promise.all(
    adapters.map(async (adapter) => ({
      name: adapter.name,
      available: await adapter.isAvailable(),
    })),
  );
}

/**
 * Get the first available terminal adapter
 *
 * @param adapters - Array of terminal adapters to check (in priority order)
 * @returns First available adapter or undefined
 */
export async function getFirstAvailableTerminal(
  adapters: TerminalAdapter[],
): Promise<TerminalAdapter | undefined> {
  for (const adapter of adapters) {
    if (await adapter.isAvailable()) {
      return adapter;
    }
  }
  return undefined;
}

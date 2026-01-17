/**
 * WezTerm Terminal Adapter
 *
 * Integration with WezTerm terminal emulator.
 * Uses `wezterm cli` commands to spawn new panes/tabs.
 */

import type { TerminalAdapter, OpenSessionOptions } from "./types";

/**
 * WezTerm terminal adapter implementation
 */
export class WezTermAdapter implements TerminalAdapter {
  name = "wezterm";

  /**
   * Check if WezTerm is available on the system
   *
   * Looks for `wezterm` in PATH
   */
  async isAvailable(): Promise<boolean> {
    // TODO: Implement in Task 5 (oc-trans-005)
    // Execute: which wezterm || where wezterm
    // Return true if found
    throw new Error("Not implemented - see Task oc-trans-005");
  }

  /**
   * Open a new terminal session in WezTerm
   *
   * Uses `wezterm cli spawn` to create a new pane
   *
   * @param options - Session options
   */
  async openSession(_options: OpenSessionOptions): Promise<void> {
    // TODO: Implement in Task 5 (oc-trans-005)
    // Build command: wezterm cli spawn --cwd <path>
    // Optionally set title and execute initial commands
    throw new Error("Not implemented - see Task oc-trans-005");
  }

  /**
   * Get WezTerm version information
   */
  async getVersion(): Promise<string | undefined> {
    // TODO: Implement in Task 5 (oc-trans-005)
    // Execute: wezterm --version
    throw new Error("Not implemented - see Task oc-trans-005");
  }
}

/**
 * Create a WezTerm adapter instance
 */
export function createWezTermAdapter(): TerminalAdapter {
  return new WezTermAdapter();
}

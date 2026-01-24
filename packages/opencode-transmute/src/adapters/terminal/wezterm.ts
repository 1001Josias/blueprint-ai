/**
 * WezTerm Terminal Adapter
 *
 * Integration with WezTerm terminal emulator.
 * Uses `wezterm cli` commands to spawn new panes/tabs.
 */

import { exec } from "../../core/exec";
import {
  TerminalNotAvailableError,
  TerminalSpawnError,
  InvalidPathError,
} from "../../core/errors";
import type { TerminalAdapter, OpenSessionOptions } from "./types";

/**
 * Options for WezTerm adapter
 */
export interface WezTermAdapterOptions {
  /**
   * Custom exec function for testing
   */
  execFn?: typeof exec;
}

/**
 * WezTerm terminal adapter implementation
 */
export class WezTermAdapter implements TerminalAdapter {
  name = "wezterm";
  private execFn: typeof exec;

  constructor(options: WezTermAdapterOptions = {}) {
    this.execFn = options.execFn ?? exec;
  }

  /**
   * Check if WezTerm is available on the system
   *
   * Looks for `wezterm` in PATH by running `wezterm --version`
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.execFn("wezterm", ["--version"], {
        throwOnError: false,
      });
      return result.exitCode === 0;
    } catch {
      // Command not found or other error
      return false;
    }
  }

  /**
   * Get WezTerm version information
   *
   * @returns Version string or undefined if not available
   */
  async getVersion(): Promise<string | undefined> {
    try {
      const result = await this.execFn("wezterm", ["--version"], {
        throwOnError: false,
      });

      if (result.exitCode !== 0) {
        return undefined;
      }

      // Parse version from output like "wezterm 20230712-072601-f4abf8fd"
      const output = result.stdout.trim();
      const match = output.match(/wezterm\s+(.+)/i);
      return match ? match[1] : output;
    } catch {
      return undefined;
    }
  }

  /**
   * Open a new terminal session in WezTerm
   *
   * Uses `wezterm cli spawn` to create a new pane in the current window.
   * If commands are provided, they are executed in sequence.
   *
   * @param options - Session options
   * @throws TerminalNotAvailableError if WezTerm is not installed
   * @throws InvalidPathError if the cwd path is invalid
   * @throws TerminalSpawnError if spawning the session fails
   */
  async openSession(options: OpenSessionOptions): Promise<void> {
    // Verify WezTerm is available
    const available = await this.isAvailable();
    if (!available) {
      throw new TerminalNotAvailableError("wezterm");
    }

    // Build the spawn command
    const args = this.buildSpawnArgs(options);

    try {
      const result = await this.execFn("wezterm", args, {
        throwOnError: false,
      });

      if (result.exitCode !== 0) {
        // Check for common error patterns
        const stderr = result.stderr.toLowerCase();

        if (
          stderr.includes("no such file or directory") ||
          stderr.includes("directory does not exist")
        ) {
          throw new InvalidPathError(options.cwd);
        }

        throw new TerminalSpawnError("wezterm", result.stderr || result.stdout);
      }
    } catch (error) {
      // Re-throw our custom errors
      if (
        error instanceof TerminalNotAvailableError ||
        error instanceof InvalidPathError ||
        error instanceof TerminalSpawnError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new TerminalSpawnError(
        "wezterm",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Build wezterm cli spawn arguments
   *
   * @param options - Session options
   * @returns Array of command arguments
   */
  private buildSpawnArgs(options: OpenSessionOptions): string[] {
    const args: string[] = ["cli", "spawn"];

    // Set working directory
    args.push("--cwd", options.cwd);

    // Set pane title if provided
    if (options.title) {
      args.push("--pane-title", options.title);
    }

    // If commands are provided, join them and pass as the program to run
    if (options.commands && options.commands.length > 0) {
      // Use -- to separate wezterm args from the command
      args.push("--");

      // Combine commands with && to run sequentially
      // Use sh -c to execute the combined command
      const combinedCommand = options.commands.join(" && ");
      args.push("sh", "-c", combinedCommand);
    }

    return args;
  }
}

/**
 * Create a WezTerm adapter instance
 *
 * @param options - Adapter options
 * @returns WezTerm adapter
 */
export function createWezTermAdapter(
  options?: WezTermAdapterOptions,
): TerminalAdapter {
  return new WezTermAdapter(options);
}

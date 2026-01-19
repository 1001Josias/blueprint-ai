/**
 * WezTerm Terminal Adapter
 *
 * Integration with WezTerm terminal emulator.
 * Uses `wezterm cli` commands to spawn new panes/tabs.
 */

import { exec } from "../../core/exec";
import {
  createTerminalNotAvailableError,
  createTerminalSpawnError,
  createInvalidPathError,
  isWorktreeError,
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
      throw createTerminalNotAvailableError("wezterm");
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
          throw createInvalidPathError(options.cwd);
        }

        throw createTerminalSpawnError(
          "wezterm",
          result.stderr || result.stdout,
        );
      }
    } catch (error) {
      // Re-throw our custom errors
      if (isWorktreeError(error)) {
        throw error;
      }

      // Wrap unexpected errors
      throw createTerminalSpawnError(
        "wezterm",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Build wezterm cli spawn or split-pane arguments
   *
   * @param options - Session options
   * @returns Array of command arguments
   */
  private buildSpawnArgs(options: OpenSessionOptions): string[] {
    // Check if we are inside a WezTerm session to decide between spawn (tab) or split-pane
    const isInWezTerm = process.env.WEZTERM_PANE !== undefined;
    const args: string[] = isInWezTerm
      ? ["cli", "split-pane"]
      : ["cli", "spawn"];

    if (isInWezTerm) {
      // For split-pane, default to right split
      args.push("--right");
    }

    // Set working directory
    args.push("--cwd", options.cwd);

    // Note: WezTerm CLI does not support --pane-title flag
    // Title is ignored for now. Could be set via escape sequences in the future.

    // If commands are provided, execute them
    if (options.commands && options.commands.length > 0) {
      // Use -- to separate wezterm args from the command
      args.push("--");

      // For a single command that is a TUI app (like opencode), run it directly
      // This ensures proper TTY handling for interactive applications
      if (
        options.commands.length === 1 &&
        options.commands[0].startsWith("opencode")
      ) {
        // Run opencode directly without sh wrapper for proper TUI rendering
        const parts = options.commands[0].split(" ");
        args.push(...parts);
      } else {
        // For multiple commands or non-TUI commands, use sh -c wrapper
        // Add exec $SHELL at the end to keep the terminal open after commands complete
        const combinedCommand = options.commands.join(" && ");
        args.push("sh", "-c", `${combinedCommand}; exec $SHELL`);
      }
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

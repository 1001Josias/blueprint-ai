/**
 * Configuration System
 *
 * Manages plugin configuration with support for multiple sources:
 * 1. opencode.config.ts (transmute section)
 * 2. .opencode/transmute.config.json
 * 3. Default values
 */

import { z } from "zod";
import * as fs from "node:fs/promises";
import { join, resolve } from "node:path";
import { hooksConfigSchema, type HooksConfig, defaultHooks } from "./hooks";
import { branchTypeSchema } from "./naming";

/**
 * Terminal type options
 */
export const terminalTypeSchema = z.enum(["wezterm", "tmux", "kitty", "none"]);
export type TerminalType = z.infer<typeof terminalTypeSchema>;

/**
 * Main configuration schema
 */
export const configSchema = z.object({
  /**
   * Directory for worktrees (relative to repository root)
   * @default "./worktrees"
   */
  worktreesDir: z.string().default("./worktrees"),

  /**
   * Default branch type prefix when AI cannot infer
   * @default "feat"
   */
  defaultBranchType: branchTypeSchema.default("feat"),

  /**
   * Maximum length for branch slug (excluding type prefix)
   * @default 40
   */
  maxBranchSlugLength: z.number().int().positive().default(40),

  /**
   * Hooks to run at lifecycle points
   */
  hooks: hooksConfigSchema.default(defaultHooks),

  /**
   * Terminal adapter to use
   * @default "wezterm"
   */
  terminal: terminalTypeSchema.default("wezterm"),

  /**
   * Whether to open terminal automatically after creating worktree
   * @default true
   */
  autoOpenTerminal: z.boolean().default(true),

  /**
   * Whether to run hooks automatically after creating worktree
   * @default true
   */
  autoRunHooks: z.boolean().default(true),

  /**
   * Base branch to create worktrees from
   * @default "main"
   */
  defaultBaseBranch: z.string().default("main"),

  /**
   * Enable AI-powered branch name generation
   * @default true
   */
  useAiBranchNaming: z.boolean().default(true),
});

/**
 * Configuration type
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Partial configuration (for user input)
 */
export type PartialConfig = z.input<typeof configSchema>;

/**
 * Default configuration values
 */
export const defaultConfig: Config = {
  worktreesDir: "./worktrees",
  defaultBranchType: "feat",
  maxBranchSlugLength: 40,
  hooks: defaultHooks,
  terminal: "wezterm",
  autoOpenTerminal: true,
  autoRunHooks: true,
  defaultBaseBranch: "main",
  useAiBranchNaming: true,
};

/**
 * Configuration file paths (in order of precedence)
 */
const CONFIG_FILES = [
  ".opencode/transmute.config.json",
  "transmute.config.json",
] as const;

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find the configuration file in the repository
 *
 * @param basePath - Repository root path
 * @returns Path to config file, or undefined if not found
 */
export async function findConfigFile(
  basePath: string,
): Promise<string | undefined> {
  for (const configFile of CONFIG_FILES) {
    const fullPath = join(basePath, configFile);
    if (await fileExists(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}

/**
 * Load configuration from a JSON file
 *
 * @param configPath - Path to the configuration file
 * @returns Partial configuration
 * @throws Error if file cannot be read or parsed
 */
export async function loadConfigFromFile(
  configPath: string,
): Promise<PartialConfig> {
  const content = await fs.readFile(configPath, "utf-8");
  const json = JSON.parse(content);
  return json as PartialConfig;
}

/**
 * Load configuration from opencode.config.ts (via dynamic import)
 *
 * Looks for a `transmute` key in the config object.
 *
 * @param basePath - Repository root path
 * @returns Partial configuration, or undefined if not found
 */
export async function loadConfigFromOpencodeConfig(
  basePath: string,
): Promise<PartialConfig | undefined> {
  const configPath = join(basePath, "opencode.config.ts");

  if (!(await fileExists(configPath))) {
    return undefined;
  }

  try {
    // Use absolute path for dynamic import
    const absolutePath = resolve(configPath);

    // Dynamic import the config file
    // Note: This requires the file to be compiled or using a runtime that supports TS
    const module = await import(absolutePath);
    const config = module.default || module;

    // Check for transmute section
    if (config && typeof config === "object" && "transmute" in config) {
      return config.transmute as PartialConfig;
    }

    return undefined;
  } catch {
    // If import fails (e.g., runtime doesn't support TS), return undefined
    return undefined;
  }
}

/**
 * Merge partial configuration with defaults
 *
 * @param partial - Partial configuration from user
 * @returns Full configuration with defaults applied
 */
export function mergeConfig(partial: PartialConfig): Config {
  return configSchema.parse(partial);
}

/**
 * Validation result type
 */
export type ConfigValidationResult =
  | { success: true; data: Config }
  | { success: false; error: z.ZodError };

/**
 * Validate configuration
 *
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateConfig(config: unknown): ConfigValidationResult {
  return configSchema.safeParse(config) as ConfigValidationResult;
}

/**
 * Configuration loading result
 */
export interface LoadConfigResult {
  /** Resolved configuration */
  config: Config;
  /** Source of the configuration */
  source: "opencode.config.ts" | "json" | "default";
  /** Path to the config file (if loaded from file) */
  configPath?: string;
}

/**
 * Load configuration from all sources with precedence
 *
 * Order of precedence:
 * 1. opencode.config.ts (transmute section)
 * 2. .opencode/transmute.config.json
 * 3. transmute.config.json
 * 4. Default values
 *
 * @param basePath - Repository root path
 * @returns Resolved configuration with source information
 *
 * @example
 * ```ts
 * const { config, source, configPath } = await loadConfig("/path/to/repo")
 *
 * console.log(config.worktreesDir) // "./worktrees"
 * console.log(source) // "json" | "opencode.config.ts" | "default"
 * ```
 */
export async function loadConfig(basePath: string): Promise<LoadConfigResult> {
  // 1. Try opencode.config.ts
  try {
    const opencodeConfig = await loadConfigFromOpencodeConfig(basePath);
    if (opencodeConfig) {
      const config = mergeConfig(opencodeConfig);
      return {
        config,
        source: "opencode.config.ts",
        configPath: join(basePath, "opencode.config.ts"),
      };
    }
  } catch {
    // Ignore errors and try next source
  }

  // 2. Try JSON config files
  const jsonConfigPath = await findConfigFile(basePath);
  if (jsonConfigPath) {
    try {
      const partialConfig = await loadConfigFromFile(jsonConfigPath);
      const config = mergeConfig(partialConfig);
      return {
        config,
        source: "json",
        configPath: jsonConfigPath,
      };
    } catch {
      // Ignore errors and fall back to defaults
    }
  }

  // 3. Use defaults
  return {
    config: defaultConfig,
    source: "default",
  };
}

/**
 * Get the resolved hooks configuration
 *
 * Merges user hooks with defaults.
 *
 * @param config - User configuration
 * @returns Resolved hooks configuration
 */
export function getHooksConfig(config: Config): HooksConfig {
  const hooks = config.hooks;

  // If no hooks specified, use defaults
  if (!hooks || (!hooks.afterCreate?.length && !hooks.beforeDestroy?.length)) {
    return defaultHooks;
  }

  return hooks;
}

/**
 * Resolve worktrees directory to absolute path
 *
 * @param basePath - Repository root path
 * @param config - Configuration
 * @returns Absolute path to worktrees directory
 */
export function resolveWorktreesDir(basePath: string, config: Config): string {
  const worktreesDir = config.worktreesDir;

  // If already absolute, return as-is
  if (worktreesDir.startsWith("/")) {
    return worktreesDir;
  }

  // Resolve relative to base path
  return resolve(basePath, worktreesDir);
}

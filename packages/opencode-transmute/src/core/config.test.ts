import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  configSchema,
  defaultConfig,
  mergeConfig,
  validateConfig,
  loadConfig,
  loadConfigFromFile,
  findConfigFile,
  getHooksConfig,
  resolveWorktreesDir,
  type Config,
  type PartialConfig,
} from "./config";
import * as fs from "node:fs/promises";

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  access: vi.fn(),
  constants: {
    F_OK: 0,
  },
}));

// Helper to create a Node.js-like error with code
function createNodeError(
  code: string,
  message = "Error",
): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  return error;
}

describe("Config Schema", () => {
  describe("configSchema", () => {
    it("should accept empty object and apply defaults", () => {
      const result = configSchema.parse({});
      expect(result).toEqual(defaultConfig);
    });

    it("should accept partial configuration", () => {
      const partial: PartialConfig = {
        worktreesDir: "./custom-worktrees",
        terminal: "tmux",
      };

      const result = configSchema.parse(partial);

      expect(result.worktreesDir).toBe("./custom-worktrees");
      expect(result.terminal).toBe("tmux");
      expect(result.defaultBranchType).toBe("feat"); // default
    });

    it("should accept full configuration", () => {
      const full: PartialConfig = {
        worktreesDir: "./wt",
        defaultBranchType: "fix",
        maxBranchSlugLength: 30,
        hooks: {
          afterCreate: ["npm install"],
          beforeDestroy: ["npm run clean"],
        },
        terminal: "kitty",
        autoOpenTerminal: false,
        autoRunHooks: false,
        defaultBaseBranch: "develop",
        useAiBranchNaming: false,
      };

      const result = configSchema.parse(full);

      expect(result).toEqual({
        worktreesDir: "./wt",
        defaultBranchType: "fix",
        maxBranchSlugLength: 30,
        hooks: {
          afterCreate: ["npm install"],
          beforeDestroy: ["npm run clean"],
        },
        terminal: "kitty",
        autoOpenTerminal: false,
        autoRunHooks: false,
        defaultBaseBranch: "develop",
        useAiBranchNaming: false,
      });
    });

    it("should reject invalid terminal type", () => {
      expect(() => configSchema.parse({ terminal: "invalid" })).toThrow();
    });

    it("should reject invalid branch type", () => {
      expect(() =>
        configSchema.parse({ defaultBranchType: "invalid" }),
      ).toThrow();
    });

    it("should reject negative maxBranchSlugLength", () => {
      expect(() => configSchema.parse({ maxBranchSlugLength: -1 })).toThrow();
    });

    it("should reject non-integer maxBranchSlugLength", () => {
      expect(() => configSchema.parse({ maxBranchSlugLength: 40.5 })).toThrow();
    });
  });

  describe("defaultConfig", () => {
    it("should have sensible defaults", () => {
      expect(defaultConfig.worktreesDir).toBe("./worktrees");
      expect(defaultConfig.defaultBranchType).toBe("feat");
      expect(defaultConfig.maxBranchSlugLength).toBe(40);
      expect(defaultConfig.terminal).toBe("wezterm");
      expect(defaultConfig.autoOpenTerminal).toBe(true);
      expect(defaultConfig.autoRunHooks).toBe(true);
      expect(defaultConfig.defaultBaseBranch).toBe("main");
      expect(defaultConfig.useAiBranchNaming).toBe(true);
    });

    it("should have default hooks", () => {
      expect(defaultConfig.hooks).toBeDefined();
      expect(defaultConfig.hooks.afterCreate).toBeDefined();
      expect(defaultConfig.hooks.afterCreate!.length).toBeGreaterThan(0);
    });
  });
});

describe("mergeConfig", () => {
  it("should merge partial config with defaults", () => {
    const partial: PartialConfig = {
      worktreesDir: "./custom",
    };

    const result = mergeConfig(partial);

    expect(result.worktreesDir).toBe("./custom");
    expect(result.terminal).toBe("wezterm"); // default
    expect(result.autoOpenTerminal).toBe(true); // default
  });

  it("should override all provided values", () => {
    const partial: PartialConfig = {
      terminal: "none",
      autoOpenTerminal: false,
      autoRunHooks: false,
    };

    const result = mergeConfig(partial);

    expect(result.terminal).toBe("none");
    expect(result.autoOpenTerminal).toBe(false);
    expect(result.autoRunHooks).toBe(false);
  });
});

describe("validateConfig", () => {
  it("should return success for valid config", () => {
    const result = validateConfig({ worktreesDir: "./test" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.worktreesDir).toBe("./test");
    }
  });

  it("should return error for invalid config", () => {
    const result = validateConfig({ terminal: "invalid-terminal" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("should return success for empty config", () => {
    const result = validateConfig({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(defaultConfig);
    }
  });
});

describe("findConfigFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should find .opencode/transmute.config.json", async () => {
    const mockAccess = vi.mocked(fs.access);
    mockAccess.mockResolvedValueOnce(undefined);

    const result = await findConfigFile("/repo");

    expect(result).toBe("/repo/.opencode/transmute.config.json");
  });

  it("should find transmute.config.json when .opencode version not found", async () => {
    const mockAccess = vi.mocked(fs.access);
    mockAccess.mockRejectedValueOnce(createNodeError("ENOENT"));
    mockAccess.mockResolvedValueOnce(undefined);

    const result = await findConfigFile("/repo");

    expect(result).toBe("/repo/transmute.config.json");
  });

  it("should return undefined when no config file exists", async () => {
    const mockAccess = vi.mocked(fs.access);
    mockAccess.mockRejectedValue(createNodeError("ENOENT"));

    const result = await findConfigFile("/repo");

    expect(result).toBeUndefined();
  });
});

describe("loadConfigFromFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load and parse JSON config", async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const configData: PartialConfig = {
      worktreesDir: "./custom-wt",
      terminal: "tmux",
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(configData));

    const result = await loadConfigFromFile("/repo/transmute.config.json");

    expect(result).toEqual(configData);
  });

  it("should throw on invalid JSON", async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    mockReadFile.mockResolvedValueOnce("not valid json");

    await expect(
      loadConfigFromFile("/repo/transmute.config.json"),
    ).rejects.toThrow();
  });

  it("should throw on file read error", async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    mockReadFile.mockRejectedValueOnce(createNodeError("ENOENT"));

    await expect(
      loadConfigFromFile("/repo/transmute.config.json"),
    ).rejects.toThrow();
  });
});

describe("loadConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should return defaults when no config file exists", async () => {
    const mockAccess = vi.mocked(fs.access);
    mockAccess.mockRejectedValue(createNodeError("ENOENT"));

    const result = await loadConfig("/repo");

    expect(result.source).toBe("default");
    expect(result.config).toEqual(defaultConfig);
    expect(result.configPath).toBeUndefined();
  });

  it("should load from JSON config file", async () => {
    const mockAccess = vi.mocked(fs.access);
    const mockReadFile = vi.mocked(fs.readFile);

    // opencode.config.ts not found
    mockAccess.mockRejectedValueOnce(createNodeError("ENOENT"));
    // .opencode/transmute.config.json found
    mockAccess.mockResolvedValueOnce(undefined);

    const configData: PartialConfig = {
      worktreesDir: "./custom",
      terminal: "tmux",
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(configData));

    const result = await loadConfig("/repo");

    expect(result.source).toBe("json");
    expect(result.config.worktreesDir).toBe("./custom");
    expect(result.config.terminal).toBe("tmux");
    expect(result.configPath).toBe("/repo/.opencode/transmute.config.json");
  });

  it("should fall back to defaults on JSON parse error", async () => {
    const mockAccess = vi.mocked(fs.access);
    const mockReadFile = vi.mocked(fs.readFile);

    // opencode.config.ts not found
    mockAccess.mockRejectedValueOnce(createNodeError("ENOENT"));
    // JSON config found
    mockAccess.mockResolvedValueOnce(undefined);
    // But contains invalid JSON
    mockReadFile.mockResolvedValueOnce("invalid json {{{");

    const result = await loadConfig("/repo");

    expect(result.source).toBe("default");
    expect(result.config).toEqual(defaultConfig);
  });
});

describe("getHooksConfig", () => {
  it("should return default hooks when config has empty hooks", () => {
    const config: Config = {
      ...defaultConfig,
      hooks: {},
    };

    const result = getHooksConfig(config);

    expect(result).toEqual(defaultConfig.hooks);
  });

  it("should return user hooks when provided", () => {
    const config: Config = {
      ...defaultConfig,
      hooks: {
        afterCreate: ["custom-install"],
        beforeDestroy: ["custom-cleanup"],
      },
    };

    const result = getHooksConfig(config);

    expect(result.afterCreate).toEqual(["custom-install"]);
    expect(result.beforeDestroy).toEqual(["custom-cleanup"]);
  });

  it("should return user hooks with only afterCreate", () => {
    const config: Config = {
      ...defaultConfig,
      hooks: {
        afterCreate: ["npm ci"],
      },
    };

    const result = getHooksConfig(config);

    expect(result.afterCreate).toEqual(["npm ci"]);
  });
});

describe("resolveWorktreesDir", () => {
  it("should resolve relative path to absolute", () => {
    const config: Config = {
      ...defaultConfig,
      worktreesDir: "./worktrees",
    };

    const result = resolveWorktreesDir("/home/user/repo", config);

    expect(result).toBe("/home/user/repo/worktrees");
  });

  it("should keep absolute path as-is", () => {
    const config: Config = {
      ...defaultConfig,
      worktreesDir: "/absolute/path/worktrees",
    };

    const result = resolveWorktreesDir("/home/user/repo", config);

    expect(result).toBe("/absolute/path/worktrees");
  });

  it("should handle paths without leading ./", () => {
    const config: Config = {
      ...defaultConfig,
      worktreesDir: "custom-worktrees",
    };

    const result = resolveWorktreesDir("/home/user/repo", config);

    expect(result).toBe("/home/user/repo/custom-worktrees");
  });

  it("should handle nested relative paths", () => {
    const config: Config = {
      ...defaultConfig,
      worktreesDir: "./work/trees",
    };

    const result = resolveWorktreesDir("/home/user/repo", config);

    expect(result).toBe("/home/user/repo/work/trees");
  });
});

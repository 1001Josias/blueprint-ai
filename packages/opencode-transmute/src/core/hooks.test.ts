/**
 * Tests for Hooks System
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  executeHooks,
  executeAfterCreateHooks,
  executeBeforeDestroyHooks,
  hooksConfigSchema,
  defaultHooks,
  type HooksConfig,
} from "./hooks";

describe("hooksConfigSchema", () => {
  it("should validate empty config", () => {
    const result = hooksConfigSchema.parse({});
    expect(result).toEqual({});
  });

  it("should validate config with afterCreate hooks", () => {
    const config = {
      afterCreate: ["pnpm install", "pnpm build"],
    };
    const result = hooksConfigSchema.parse(config);
    expect(result.afterCreate).toEqual(["pnpm install", "pnpm build"]);
  });

  it("should validate config with beforeDestroy hooks", () => {
    const config = {
      beforeDestroy: ["rm -rf node_modules"],
    };
    const result = hooksConfigSchema.parse(config);
    expect(result.beforeDestroy).toEqual(["rm -rf node_modules"]);
  });

  it("should validate config with both hook types", () => {
    const config = {
      afterCreate: ["pnpm install"],
      beforeDestroy: ["pnpm clean"],
    };
    const result = hooksConfigSchema.parse(config);
    expect(result.afterCreate).toEqual(["pnpm install"]);
    expect(result.beforeDestroy).toEqual(["pnpm clean"]);
  });

  it("should reject invalid hook types", () => {
    expect(() =>
      hooksConfigSchema.parse({
        afterCreate: "not an array",
      }),
    ).toThrow();
  });
});

describe("executeHooks", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "hooks-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("basic execution", () => {
    it("should execute a single command successfully", async () => {
      const results = await executeHooks(["echo hello"], { cwd: tempDir });

      expect(results).toHaveLength(1);
      expect(results[0].command).toBe("echo hello");
      expect(results[0].success).toBe(true);
      expect(results[0].stdout.trim()).toBe("hello");
      expect(results[0].exitCode).toBe(0);
      expect(results[0].duration).toBeGreaterThanOrEqual(0);
    });

    it("should execute multiple commands in sequence", async () => {
      const results = await executeHooks(["echo first", "echo second"], {
        cwd: tempDir,
      });

      expect(results).toHaveLength(2);
      expect(results[0].stdout.trim()).toBe("first");
      expect(results[1].stdout.trim()).toBe("second");
    });

    it("should return empty array for empty commands", async () => {
      const results = await executeHooks([], { cwd: tempDir });
      expect(results).toHaveLength(0);
    });

    it("should capture stderr", async () => {
      const results = await executeHooks(["echo error >&2"], { cwd: tempDir });

      expect(results).toHaveLength(1);
      expect(results[0].stderr.trim()).toBe("error");
    });

    it("should measure execution duration", async () => {
      const results = await executeHooks(["sleep 0.1"], { cwd: tempDir });

      expect(results).toHaveLength(1);
      expect(results[0].duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe("working directory", () => {
    it("should execute commands in the specified cwd", async () => {
      const results = await executeHooks(["pwd"], { cwd: tempDir });

      expect(results).toHaveLength(1);
      // Use realpath to handle macOS /var -> /private/var symlink
      const { realpath } = await import("node:fs/promises");
      const realTempDir = await realpath(tempDir);
      expect(results[0].stdout.trim()).toBe(realTempDir);
    });

    it("should create files in the correct directory", async () => {
      await executeHooks(["touch test.txt"], { cwd: tempDir });

      const { stat } = await import("node:fs/promises");
      const fileExists = await stat(join(tempDir, "test.txt"))
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);
    });
  });

  describe("error handling - strict mode (default)", () => {
    it("should stop on first error by default", async () => {
      const results = await executeHooks(["exit 1", "echo should-not-run"], {
        cwd: tempDir,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].exitCode).toBe(1);
    });

    it("should stop on first error when stopOnError is true", async () => {
      const results = await executeHooks(["exit 1", "echo should-not-run"], {
        cwd: tempDir,
        stopOnError: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });

    it("should capture exit code on failure", async () => {
      const results = await executeHooks(["exit 42"], { cwd: tempDir });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].exitCode).toBe(42);
    });
  });

  describe("error handling - lenient mode", () => {
    it("should continue after error when stopOnError is false", async () => {
      const results = await executeHooks(["exit 1", "echo after-error"], {
        cwd: tempDir,
        stopOnError: false,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
      expect(results[1].stdout.trim()).toBe("after-error");
    });

    it("should collect all results in lenient mode", async () => {
      const results = await executeHooks(
        ["echo ok", "exit 1", "echo still-ok"],
        { cwd: tempDir, stopOnError: false },
      );

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe("environment variables", () => {
    it("should pass environment variables to commands", async () => {
      const results = await executeHooks(["echo $MY_VAR"], {
        cwd: tempDir,
        env: { MY_VAR: "hello-env" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].stdout.trim()).toBe("hello-env");
    });

    it("should inherit process.env", async () => {
      const results = await executeHooks(["echo $HOME"], { cwd: tempDir });

      expect(results).toHaveLength(1);
      expect(results[0].stdout.trim()).toBe(process.env.HOME);
    });

    it("should override process.env with custom env", async () => {
      const results = await executeHooks(["echo $CUSTOM_VAR"], {
        cwd: tempDir,
        env: { CUSTOM_VAR: "custom-value" },
      });

      expect(results).toHaveLength(1);
      expect(results[0].stdout.trim()).toBe("custom-value");
    });
  });

  describe("complex commands", () => {
    it("should handle piped commands", async () => {
      const results = await executeHooks(["echo hello | tr a-z A-Z"], {
        cwd: tempDir,
      });

      expect(results).toHaveLength(1);
      expect(results[0].stdout.trim()).toBe("HELLO");
    });

    it("should handle command substitution", async () => {
      const results = await executeHooks(["echo $(echo nested)"], {
        cwd: tempDir,
      });

      expect(results).toHaveLength(1);
      expect(results[0].stdout.trim()).toBe("nested");
    });

    it("should handle conditional commands", async () => {
      await writeFile(join(tempDir, "exists.txt"), "content");

      const results = await executeHooks(
        ["[ -f exists.txt ] && echo found || echo not-found"],
        { cwd: tempDir },
      );

      expect(results).toHaveLength(1);
      expect(results[0].stdout.trim()).toBe("found");
    });
  });
});

describe("executeAfterCreateHooks", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "hooks-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should return empty array when no afterCreate hooks", async () => {
    const config: HooksConfig = {};
    const results = await executeAfterCreateHooks(config, { cwd: tempDir });
    expect(results).toHaveLength(0);
  });

  it("should return empty array when afterCreate is empty", async () => {
    const config: HooksConfig = { afterCreate: [] };
    const results = await executeAfterCreateHooks(config, { cwd: tempDir });
    expect(results).toHaveLength(0);
  });

  it("should execute afterCreate hooks", async () => {
    const config: HooksConfig = {
      afterCreate: ["echo setup-complete"],
    };
    const results = await executeAfterCreateHooks(config, { cwd: tempDir });

    expect(results).toHaveLength(1);
    expect(results[0].stdout.trim()).toBe("setup-complete");
  });
});

describe("executeBeforeDestroyHooks", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "hooks-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should return empty array when no beforeDestroy hooks", async () => {
    const config: HooksConfig = {};
    const results = await executeBeforeDestroyHooks(config, { cwd: tempDir });
    expect(results).toHaveLength(0);
  });

  it("should return empty array when beforeDestroy is empty", async () => {
    const config: HooksConfig = { beforeDestroy: [] };
    const results = await executeBeforeDestroyHooks(config, { cwd: tempDir });
    expect(results).toHaveLength(0);
  });

  it("should execute beforeDestroy hooks", async () => {
    const config: HooksConfig = {
      beforeDestroy: ["echo cleanup-complete"],
    };
    const results = await executeBeforeDestroyHooks(config, { cwd: tempDir });

    expect(results).toHaveLength(1);
    expect(results[0].stdout.trim()).toBe("cleanup-complete");
  });
});

describe("defaultHooks", () => {
  it("should have afterCreate hooks defined", () => {
    expect(defaultHooks.afterCreate).toBeDefined();
    expect(defaultHooks.afterCreate).toHaveLength(1);
  });

  it("should have empty beforeDestroy hooks", () => {
    expect(defaultHooks.beforeDestroy).toEqual([]);
  });

  it("should be a valid HooksConfig", () => {
    const result = hooksConfigSchema.parse(defaultHooks);
    expect(result).toEqual(defaultHooks);
  });
});

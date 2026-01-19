/**
 * Tests for WezTerm Terminal Adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WezTermAdapter, createWezTermAdapter } from "./wezterm";
import type { ExecResult } from "../../core/exec";
import {
  createTerminalNotAvailableError,
  createTerminalSpawnError,
  createInvalidPathError,
} from "../../core/errors";

// Helper to create a properly typed mock exec function
function createMockExec() {
  return vi.fn<
    [string, string[], { throwOnError?: boolean; cwd?: string }?],
    Promise<ExecResult>
  >();
}

describe("WezTermAdapter", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isAvailable", () => {
    it("should return true when wezterm is installed", async () => {
      const mockExec = createMockExec().mockResolvedValue({
        stdout: "wezterm 20230712-072601-f4abf8fd\n",
        stderr: "",
        exitCode: 0,
      });

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const result = await adapter.isAvailable();

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith("wezterm", ["--version"], {
        throwOnError: false,
      });
    });

    it("should return false when wezterm is not installed", async () => {
      const mockExec = createMockExec().mockResolvedValue({
        stdout: "",
        stderr: "command not found: wezterm",
        exitCode: 127,
      });

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });

    it("should return false when exec throws an error", async () => {
      const mockExec = createMockExec().mockRejectedValue(new Error("ENOENT"));

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe("getVersion", () => {
    it("should return version string when wezterm is available", async () => {
      const mockExec = createMockExec().mockResolvedValue({
        stdout: "wezterm 20230712-072601-f4abf8fd\n",
        stderr: "",
        exitCode: 0,
      });

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const version = await adapter.getVersion();

      expect(version).toBe("20230712-072601-f4abf8fd");
    });

    it("should handle version output without 'wezterm' prefix", async () => {
      const mockExec = createMockExec().mockResolvedValue({
        stdout: "20240101-abcdef12\n",
        stderr: "",
        exitCode: 0,
      });

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const version = await adapter.getVersion();

      expect(version).toBe("20240101-abcdef12");
    });

    it("should return undefined when wezterm is not installed", async () => {
      const mockExec = createMockExec().mockResolvedValue({
        stdout: "",
        stderr: "command not found",
        exitCode: 127,
      });

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const version = await adapter.getVersion();

      expect(version).toBeUndefined();
    });

    it("should return undefined when exec throws", async () => {
      const mockExec = createMockExec().mockRejectedValue(new Error("ENOENT"));

      const adapter = new WezTermAdapter({ execFn: mockExec });
      const version = await adapter.getVersion();

      expect(version).toBeUndefined();
    });
  });

  describe("openSession", () => {
    let mockExec: ReturnType<typeof createMockExec>;
    let adapter: WezTermAdapter;

    beforeEach(() => {
      mockExec = createMockExec();
      adapter = new WezTermAdapter({ execFn: mockExec });
    });

    it("should spawn a session with cwd", async () => {
      // Mock environment variable to simulate NOT being in WezTerm
      delete process.env.WEZTERM_PANE;

      // First call: isAvailable check
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      // Second call: spawn
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await adapter.openSession({ cwd: "/path/to/worktree" });

      expect(mockExec).toHaveBeenCalledTimes(2);
      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        ["cli", "spawn", "--cwd", "/path/to/worktree"],
        { throwOnError: false },
      );
    });

    it("should split a pane with cwd when inside WezTerm", async () => {
      // Mock environment variable to simulate being in WezTerm
      process.env.WEZTERM_PANE = "123";

      // First call: isAvailable check
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      // Second call: split-pane
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await adapter.openSession({ cwd: "/path/to/worktree" });

      expect(mockExec).toHaveBeenCalledTimes(2);
      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        ["cli", "split-pane", "--right", "--cwd", "/path/to/worktree"],
        { throwOnError: false },
      );
    });

    it("should ignore title (WezTerm CLI does not support --pane-title)", async () => {
      delete process.env.WEZTERM_PANE;
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await adapter.openSession({
        cwd: "/path/to/worktree",
        title: "My Task",
      });

      // Title is not included in args because WezTerm CLI doesn't support it
      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        ["cli", "spawn", "--cwd", "/path/to/worktree"],
        { throwOnError: false },
      );
    });

    it("should execute commands when provided", async () => {
      delete process.env.WEZTERM_PANE;
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await adapter.openSession({
        cwd: "/path/to/worktree",
        commands: ["pnpm install", "pnpm dev"],
      });

      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        [
          "cli",
          "spawn",
          "--cwd",
          "/path/to/worktree",
          "--",
          "sh",
          "-c",
          "pnpm install && pnpm dev; exec $SHELL",
        ],
        { throwOnError: false },
      );
    });

    it("should include all options together (except title)", async () => {
      delete process.env.WEZTERM_PANE;
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await adapter.openSession({
        cwd: "/path/to/worktree",
        title: "feat/add-login", // ignored - WezTerm CLI doesn't support it
        commands: ["opencode --session abc123"],
      });

      // Note: --pane-title is NOT included because WezTerm CLI doesn't support it
      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        [
          "cli",
          "spawn",
          "--cwd",
          "/path/to/worktree",
          "--",
          "sh",
          "-c",
          "opencode --session abc123; exec $SHELL",
        ],
        { throwOnError: false },
      );
    });

    it("should throw TerminalNotAvailableError when wezterm is not installed", async () => {
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "command not found",
        exitCode: 127,
      });

      await expect(
        adapter.openSession({ cwd: "/path/to/worktree" }),
      ).rejects.toMatchObject({ code: "NOT_AVAILABLE" });
    });

    it("should throw InvalidPathError when path does not exist", async () => {
      delete process.env.WEZTERM_PANE;
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "Error: No such file or directory",
        exitCode: 1,
      });

      await expect(
        adapter.openSession({ cwd: "/nonexistent/path" }),
      ).rejects.toMatchObject({ code: "INVALID_PATH" });
    });

    it("should throw TerminalSpawnError for other spawn failures", async () => {
      delete process.env.WEZTERM_PANE;
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockResolvedValueOnce({
        stdout: "",
        stderr: "Connection refused",
        exitCode: 1,
      });

      await expect(
        adapter.openSession({ cwd: "/path/to/worktree" }),
      ).rejects.toMatchObject({ code: "SPAWN_FAILED" });
    });

    it("should wrap unexpected errors in TerminalSpawnError", async () => {
      delete process.env.WEZTERM_PANE;
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockRejectedValueOnce(new Error("Unexpected error"));

      await expect(
        adapter.openSession({ cwd: "/path/to/worktree" }),
      ).rejects.toMatchObject({ code: "SPAWN_FAILED" });
    });
  });

  describe("createWezTermAdapter", () => {
    it("should create a WezTermAdapter instance", () => {
      const adapter = createWezTermAdapter();

      expect(adapter).toBeInstanceOf(WezTermAdapter);
      expect(adapter.name).toBe("wezterm");
    });

    it("should accept custom exec function", () => {
      const mockExec = createMockExec();
      const adapter = createWezTermAdapter({ execFn: mockExec });

      expect(adapter).toBeInstanceOf(WezTermAdapter);
    });
  });

  describe("adapter properties", () => {
    it("should have name property set to 'wezterm'", () => {
      const adapter = new WezTermAdapter();
      expect(adapter.name).toBe("wezterm");
    });
  });
});

describe("Terminal error factory functions", () => {
  describe("createTerminalNotAvailableError", () => {
    it("should include terminal name in message", () => {
      const error = createTerminalNotAvailableError("wezterm");

      expect(error.message).toContain("wezterm");
      expect(error.message).toContain("not available");
      expect(error.terminal).toBe("wezterm");
      expect(error.code).toBe("NOT_AVAILABLE");
    });
  });

  describe("createTerminalSpawnError", () => {
    it("should include terminal name and reason in message", () => {
      const error = createTerminalSpawnError("wezterm", "Connection refused");

      expect(error.message).toContain("wezterm");
      expect(error.message).toContain("Connection refused");
      expect(error.terminal).toBe("wezterm");
      expect(error.reason).toBe("Connection refused");
      expect(error.code).toBe("SPAWN_FAILED");
    });
  });

  describe("createInvalidPathError", () => {
    it("should include path in message", () => {
      const error = createInvalidPathError("/nonexistent/path");

      expect(error.message).toContain("/nonexistent/path");
      expect(error.path).toBe("/nonexistent/path");
      expect(error.code).toBe("INVALID_PATH");
    });
  });
});

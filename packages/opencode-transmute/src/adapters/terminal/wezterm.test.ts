/**
 * Tests for WezTerm Terminal Adapter
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WezTermAdapter, createWezTermAdapter } from "./wezterm";
import type { ExecResult } from "../../core/exec";
import {
  TerminalNotAvailableError,
  TerminalSpawnError,
  InvalidPathError,
} from "../../core/errors";

// Helper to create a properly typed mock exec function
function createMockExec() {
  return vi.fn<
    [string, string[], { throwOnError?: boolean; cwd?: string }?],
    Promise<ExecResult>
  >();
}

describe("WezTermAdapter", () => {
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

    it("should include title when provided", async () => {
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

      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        [
          "cli",
          "spawn",
          "--cwd",
          "/path/to/worktree",
          "--pane-title",
          "My Task",
        ],
        { throwOnError: false },
      );
    });

    it("should execute commands when provided", async () => {
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
          "pnpm install && pnpm dev",
        ],
        { throwOnError: false },
      );
    });

    it("should include all options together", async () => {
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
        title: "feat/add-login",
        commands: ["opencode --session abc123"],
      });

      expect(mockExec).toHaveBeenLastCalledWith(
        "wezterm",
        [
          "cli",
          "spawn",
          "--cwd",
          "/path/to/worktree",
          "--pane-title",
          "feat/add-login",
          "--",
          "sh",
          "-c",
          "opencode --session abc123",
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
      ).rejects.toThrow(TerminalNotAvailableError);
    });

    it("should throw InvalidPathError when path does not exist", async () => {
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
      ).rejects.toThrow(InvalidPathError);
    });

    it("should throw TerminalSpawnError for other spawn failures", async () => {
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
      ).rejects.toThrow(TerminalSpawnError);
    });

    it("should wrap unexpected errors in TerminalSpawnError", async () => {
      mockExec.mockResolvedValueOnce({
        stdout: "wezterm 20230712\n",
        stderr: "",
        exitCode: 0,
      });
      mockExec.mockRejectedValueOnce(new Error("Unexpected error"));

      await expect(
        adapter.openSession({ cwd: "/path/to/worktree" }),
      ).rejects.toThrow(TerminalSpawnError);
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

describe("Terminal error classes", () => {
  describe("TerminalNotAvailableError", () => {
    it("should include terminal name in message", () => {
      const error = new TerminalNotAvailableError("wezterm");

      expect(error.message).toContain("wezterm");
      expect(error.message).toContain("not available");
      expect(error.terminal).toBe("wezterm");
      expect(error.code).toBe("NOT_AVAILABLE");
    });
  });

  describe("TerminalSpawnError", () => {
    it("should include terminal name and reason in message", () => {
      const error = new TerminalSpawnError("wezterm", "Connection refused");

      expect(error.message).toContain("wezterm");
      expect(error.message).toContain("Connection refused");
      expect(error.terminal).toBe("wezterm");
      expect(error.reason).toBe("Connection refused");
      expect(error.code).toBe("SPAWN_FAILED");
    });
  });

  describe("InvalidPathError", () => {
    it("should include path in message", () => {
      const error = new InvalidPathError("/nonexistent/path");

      expect(error.message).toContain("/nonexistent/path");
      expect(error.path).toBe("/nonexistent/path");
      expect(error.code).toBe("INVALID_PATH");
    });
  });
});

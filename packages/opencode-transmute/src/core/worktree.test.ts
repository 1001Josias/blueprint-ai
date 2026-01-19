import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseWorktreeListOutput,
  listWorktrees,
  createWorktree,
  worktreeExists,
  getWorktreeByBranch,
  getWorktreesDir,
  getWorktreePath,
} from "./worktree";
import * as execModule from "./exec";
import {
  createBranchAlreadyExistsError as _createBranchAlreadyExistsError,
  createDirectoryAlreadyExistsError as _createDirectoryAlreadyExistsError,
  createBaseBranchNotFoundError as _createBaseBranchNotFoundError,
} from "./errors";
import * as fs from "node:fs/promises";

// Mock the exec module
vi.mock("./exec", () => ({
  gitExec: vi.fn(),
  getGitRoot: vi.fn(),
  branchExists: vi.fn(),
}));

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn(),
  access: vi.fn(),
  constants: { F_OK: 0 },
}));

describe("parseWorktreeListOutput", () => {
  it("parses a single main worktree", () => {
    const output = `worktree /home/user/project
HEAD abc123def456789
branch refs/heads/main
`;
    const result = parseWorktreeListOutput(output, "/home/user/project");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: "/home/user/project",
      branch: "main",
      head: "abc123def456789",
      isMain: true,
    });
  });

  it("parses multiple worktrees", () => {
    const output = `worktree /home/user/project
HEAD abc123
branch refs/heads/main

worktree /home/user/project/worktrees/feat-auth
HEAD def456
branch refs/heads/feat/auth

worktree /home/user/project/worktrees/fix-bug
HEAD ghi789
branch refs/heads/fix/bug-123
`;
    const result = parseWorktreeListOutput(output, "/home/user/project");

    expect(result).toHaveLength(3);
    expect(result[0].isMain).toBe(true);
    expect(result[0].branch).toBe("main");
    expect(result[1].isMain).toBe(false);
    expect(result[1].branch).toBe("feat/auth");
    expect(result[1].path).toBe("/home/user/project/worktrees/feat-auth");
    expect(result[2].branch).toBe("fix/bug-123");
  });

  it("handles detached HEAD state", () => {
    const output = `worktree /home/user/project
HEAD abc123
branch refs/heads/main

worktree /home/user/project/worktrees/detached
HEAD def456
detached
`;
    const result = parseWorktreeListOutput(output, "/home/user/project");

    expect(result).toHaveLength(2);
    expect(result[1].branch).toBe("(detached)");
  });

  it("handles empty output", () => {
    const result = parseWorktreeListOutput("", "/home/user/project");
    expect(result).toHaveLength(0);
  });

  it("normalizes paths with trailing slashes", () => {
    const output = `worktree /home/user/project/
HEAD abc123
branch refs/heads/main
`;
    const result = parseWorktreeListOutput(output, "/home/user/project");

    expect(result).toHaveLength(1);
    expect(result[0].isMain).toBe(true);
  });

  it("extracts HEAD commit correctly", () => {
    const output = `worktree /repo
HEAD a1b2c3d4e5f6789012345678901234567890abcd
branch refs/heads/main
`;
    const result = parseWorktreeListOutput(output, "/repo");

    expect(result[0].head).toBe("a1b2c3d4e5f6789012345678901234567890abcd");
  });
});

describe("listWorktrees", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns parsed worktrees from git command", async () => {
    vi.mocked(execModule.getGitRoot).mockResolvedValue("/home/user/project");
    vi.mocked(execModule.gitExec).mockResolvedValue({
      stdout: `worktree /home/user/project
HEAD abc123
branch refs/heads/main

worktree /home/user/project/worktrees/feat-new
HEAD def456
branch refs/heads/feat/new-feature
`,
      stderr: "",
      exitCode: 0,
    });

    const result = await listWorktrees();

    expect(execModule.gitExec).toHaveBeenCalledWith(
      ["worktree", "list", "--porcelain"],
      { cwd: undefined },
    );
    expect(result).toHaveLength(2);
    expect(result[0].isMain).toBe(true);
    expect(result[1].branch).toBe("feat/new-feature");
  });

  it("passes cwd to git commands", async () => {
    vi.mocked(execModule.getGitRoot).mockResolvedValue("/custom/path");
    vi.mocked(execModule.gitExec).mockResolvedValue({
      stdout: `worktree /custom/path
HEAD abc
branch refs/heads/main
`,
      stderr: "",
      exitCode: 0,
    });

    await listWorktrees("/custom/path");

    expect(execModule.getGitRoot).toHaveBeenCalledWith("/custom/path");
    expect(execModule.gitExec).toHaveBeenCalledWith(
      ["worktree", "list", "--porcelain"],
      { cwd: "/custom/path" },
    );
  });
});

describe("createWorktree", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mocks for successful creation
    vi.mocked(execModule.getGitRoot).mockResolvedValue("/home/user/project");
    vi.mocked(execModule.branchExists).mockResolvedValue(false);
    vi.mocked(execModule.gitExec).mockImplementation(async (args) => {
      if (args[0] === "worktree" && args[1] === "list") {
        return {
          stdout: `worktree /home/user/project
HEAD abc
branch refs/heads/main
`,
          stderr: "",
          exitCode: 0,
        };
      }
      if (args[0] === "rev-parse") {
        return { stdout: "abc123def456\n", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    });
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockRejectedValue({ code: "ENOENT" });
  });

  it("creates a new worktree with a new branch", async () => {
    // Base branch exists
    vi.mocked(execModule.branchExists).mockImplementation(async (branch) => {
      return branch === "main";
    });

    const result = await createWorktree({
      branch: "feat/new-feature",
      baseBranch: "main",
    });

    expect(execModule.gitExec).toHaveBeenCalledWith(
      [
        "worktree",
        "add",
        "-b",
        "feat/new-feature",
        expect.stringContaining("feat-new-feature"),
        "main",
      ],
      { cwd: undefined },
    );
    expect(result.branch).toBe("feat/new-feature");
    expect(result.isMain).toBe(false);
    expect(result.path).toContain("feat-new-feature");
  });

  it("uses existing branch if it exists without worktree", async () => {
    // Both branches exist, but no worktree for feat/existing
    vi.mocked(execModule.branchExists).mockResolvedValue(true);
    vi.mocked(execModule.gitExec).mockImplementation(async (args) => {
      if (args[0] === "worktree" && args[1] === "list") {
        return {
          stdout: `worktree /home/user/project
HEAD abc
branch refs/heads/main
`,
          stderr: "",
          exitCode: 0,
        };
      }
      if (args[0] === "rev-parse") {
        return { stdout: "abc123\n", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    });

    await createWorktree({
      branch: "feat/existing",
      baseBranch: "main",
    });

    expect(execModule.gitExec).toHaveBeenCalledWith(
      [
        "worktree",
        "add",
        expect.stringContaining("feat-existing"),
        "feat/existing",
      ],
      { cwd: undefined },
    );
  });

  it("throws BranchAlreadyExistsError when branch has worktree", async () => {
    vi.mocked(execModule.branchExists).mockResolvedValue(true);
    vi.mocked(execModule.gitExec).mockImplementation(async (args) => {
      if (args[0] === "worktree" && args[1] === "list") {
        return {
          stdout: `worktree /home/user/project
HEAD abc
branch refs/heads/main

worktree /home/user/project/worktrees/feat-existing
HEAD def
branch refs/heads/feat/existing
`,
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    });

    await expect(
      createWorktree({ branch: "feat/existing" }),
    ).rejects.toMatchObject({ code: "BRANCH_EXISTS" });
  });

  it("throws DirectoryAlreadyExistsError when directory exists", async () => {
    vi.mocked(execModule.branchExists).mockImplementation(async (branch) => {
      return branch === "main";
    });
    vi.mocked(fs.access).mockResolvedValue(undefined); // Directory exists

    await expect(createWorktree({ branch: "feat/new" })).rejects.toMatchObject({
      code: "DIR_EXISTS",
    });
  });

  it("throws BaseBranchNotFoundError when base branch missing", async () => {
    vi.mocked(execModule.branchExists).mockResolvedValue(false);

    await expect(
      createWorktree({ branch: "feat/new", baseBranch: "nonexistent" }),
    ).rejects.toMatchObject({ code: "BASE_NOT_FOUND" });
  });

  it("uses default baseBranch 'main' when not specified", async () => {
    vi.mocked(execModule.branchExists).mockImplementation(async (branch) => {
      return branch === "main";
    });

    await createWorktree({ branch: "feat/new" });

    expect(execModule.branchExists).toHaveBeenCalledWith("main", undefined);
  });

  it("validates empty branch name", async () => {
    await expect(createWorktree({ branch: "" })).rejects.toThrow();
  });

  it("uses custom targetDir when provided", async () => {
    vi.mocked(execModule.branchExists).mockImplementation(async (branch) => {
      return branch === "main";
    });

    await createWorktree({
      branch: "feat/custom",
      targetDir: "/custom/path/my-worktree",
    });

    expect(execModule.gitExec).toHaveBeenCalledWith(
      expect.arrayContaining(["/custom/path/my-worktree"]),
      expect.anything(),
    );
  });

  it("creates parent directory if needed", async () => {
    vi.mocked(execModule.branchExists).mockImplementation(async (branch) => {
      return branch === "main";
    });

    await createWorktree({ branch: "feat/new" });

    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("attempts to update base branch before creating worktree", async () => {
    vi.mocked(execModule.branchExists).mockResolvedValue(true);
    vi.mocked(fs.access).mockRejectedValue({ code: "ENOENT" });
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);

    // Mock current branch check to return 'other-branch' (not main)
    vi.mocked(execModule.gitExec).mockImplementation(async (args) => {
      if (args[0] === "rev-parse" && args[1] === "--abbrev-ref") {
        return { stdout: "other-branch\n", stderr: "", exitCode: 0 };
      }
      if (args[0] === "rev-parse" && args[1] === "HEAD") {
        return { stdout: "abc1234\n", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    });

    await createWorktree({
      branch: "feat/new",
      baseBranch: "main",
    });

    // Should verify current branch
    expect(execModule.gitExec).toHaveBeenCalledWith(
      ["rev-parse", "--abbrev-ref", "HEAD"],
      expect.any(Object),
    );

    // Should attempt to fetch origin main:main
    expect(execModule.gitExec).toHaveBeenCalledWith(
      ["fetch", "origin", "main:main"],
      expect.objectContaining({ throwOnError: false }),
    );
  });
});

describe("worktreeExists", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns true when worktree exists", async () => {
    vi.mocked(execModule.getGitRoot).mockResolvedValue("/repo");
    vi.mocked(execModule.gitExec).mockResolvedValue({
      stdout: `worktree /repo
HEAD abc
branch refs/heads/main

worktree /repo/worktrees/feat-auth
HEAD def
branch refs/heads/feat/auth
`,
      stderr: "",
      exitCode: 0,
    });

    const result = await worktreeExists("feat/auth");
    expect(result).toBe(true);
  });

  it("returns false when worktree does not exist", async () => {
    vi.mocked(execModule.getGitRoot).mockResolvedValue("/repo");
    vi.mocked(execModule.gitExec).mockResolvedValue({
      stdout: `worktree /repo
HEAD abc
branch refs/heads/main
`,
      stderr: "",
      exitCode: 0,
    });

    const result = await worktreeExists("feat/nonexistent");
    expect(result).toBe(false);
  });
});

describe("getWorktreeByBranch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(execModule.getGitRoot).mockResolvedValue("/repo");
  });

  it("returns worktree when found", async () => {
    vi.mocked(execModule.gitExec).mockResolvedValue({
      stdout: `worktree /repo
HEAD abc
branch refs/heads/main

worktree /repo/worktrees/feat-test
HEAD def
branch refs/heads/feat/test
`,
      stderr: "",
      exitCode: 0,
    });

    const result = await getWorktreeByBranch("feat/test");
    expect(result).toBeDefined();
    expect(result?.path).toBe("/repo/worktrees/feat-test");
  });

  it("returns undefined when not found", async () => {
    vi.mocked(execModule.gitExec).mockResolvedValue({
      stdout: `worktree /repo
HEAD abc
branch refs/heads/main
`,
      stderr: "",
      exitCode: 0,
    });

    const result = await getWorktreeByBranch("feat/nonexistent");
    expect(result).toBeUndefined();
  });
});

describe("getWorktreesDir", () => {
  it("returns correct worktrees directory path", () => {
    expect(getWorktreesDir("/home/user/project")).toBe(
      "/home/user/project/worktrees",
    );
  });
});

describe("getWorktreePath", () => {
  it("converts branch slashes to hyphens", () => {
    expect(getWorktreePath("/repo", "feat/new-feature")).toBe(
      "/repo/worktrees/feat-new-feature",
    );
  });

  it("handles simple branch names", () => {
    expect(getWorktreePath("/repo", "develop")).toBe("/repo/worktrees/develop");
  });

  it("handles nested branch paths", () => {
    expect(getWorktreePath("/repo", "feat/ui/button")).toBe(
      "/repo/worktrees/feat-ui-button",
    );
  });
});

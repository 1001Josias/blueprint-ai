import { describe, it, expect } from "vitest";
import {
  generateBranchName,
  generateFallbackBranchName,
  sanitizeBranchName,
  type TaskContext,
} from "./naming";

describe("sanitizeBranchName", () => {
  it("converts to lowercase", () => {
    expect(sanitizeBranchName("My-Branch-Name")).toBe("my-branch-name");
  });

  it("removes invalid characters", () => {
    expect(sanitizeBranchName("feat/my_branch!")).toBe("feat/my-branch");
  });

  it("collapses multiple hyphens", () => {
    expect(sanitizeBranchName("my--branch---name")).toBe("my-branch-name");
  });

  it("respects max length", () => {
    expect(sanitizeBranchName("a".repeat(60), 10)).toBe("a".repeat(10));
  });

  it("removes leading and trailing hyphens", () => {
    expect(sanitizeBranchName("-branch-name-")).toBe("branch-name");
  });
});

describe("generateFallbackBranchName", () => {
  const baseContext: TaskContext = {
    id: "task-123",
    title: "Implement new feature",
    description: "Some description",
  };

  it("uses provided type if valid", () => {
    const result = generateFallbackBranchName({ ...baseContext, type: "fix" });
    expect(result.type).toBe("fix");
    expect(result.branch).toContain("fix/");
  });

  it("defaults to feat if type not provided", () => {
    const result = generateFallbackBranchName(baseContext);
    expect(result.type).toBe("feat");
    expect(result.branch).toContain("feat/");
  });

  it("generates correct format with task id and title", () => {
    const result = generateFallbackBranchName(baseContext);
    expect(result.slug).toBe("task-123-implement-new-feature");
    expect(result.branch).toBe("feat/task-123-implement-new-feature");
  });
});

describe("generateBranchName", () => {
  const context: TaskContext = {
    id: "task-001",
    title: "Initial Setup",
  };

  it("validates input context", () => {
    expect(() => generateBranchName({} as any)).toThrow();
  });

  it("uses agent-provided branch name when available", () => {
    const result = generateBranchName(context, {
      type: "chore",
      slug: "initial-setup-chore",
    });

    expect(result).toEqual({
      branch: "chore/initial-setup-chore",
      type: "chore",
      slug: "initial-setup-chore",
    });
  });

  it("sanitizes agent-provided slug", () => {
    const result = generateBranchName(context, {
      type: "feat",
      slug: "My Start UP!",
    });

    // "My Start UP!" -> "my-start-up" (spaces and ! become hyphens, then cleaned)
    expect(result).toEqual({
      branch: "feat/my-start-up",
      type: "feat",
      slug: "my-start-up",
    });
  });

  it("falls back to deterministic naming when no branch name provided", () => {
    const result = generateBranchName(context);
    
    expect(result.type).toBe("feat"); // default
    expect(result.slug).toBe("task-001-initial-setup");
    expect(result.branch).toBe("feat/task-001-initial-setup");
  });
});

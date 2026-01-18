import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeBranchName,
  generateFallbackBranchName,
  generateBranchName,
  generateBranchNameWithAI,
  type OpenCodeClient,
  type TaskContext,
} from "./naming";

describe("sanitizeBranchName", () => {
  it("converts to lowercase", () => {
    expect(sanitizeBranchName("FEAT/ADD-LOGIN")).toBe("feat/add-login");
  });

  it("removes invalid characters", () => {
    expect(sanitizeBranchName("feat/add login!@#$%")).toBe("feat/add-login");
  });

  it("collapses multiple hyphens", () => {
    expect(sanitizeBranchName("feat/add---login")).toBe("feat/add-login");
  });

  it("respects max length", () => {
    const long = "a".repeat(100);
    expect(sanitizeBranchName(long, 50).length).toBe(50);
  });

  it("removes leading and trailing hyphens", () => {
    expect(sanitizeBranchName("-feat/login-")).toBe("feat/login");
  });

  it("preserves forward slashes for branch format", () => {
    expect(sanitizeBranchName("feat/my-feature")).toBe("feat/my-feature");
  });

  it("replaces spaces with hyphens", () => {
    expect(sanitizeBranchName("feat/my feature name")).toBe(
      "feat/my-feature-name",
    );
  });

  it("handles underscores", () => {
    expect(sanitizeBranchName("feat/my_feature")).toBe("feat/my-feature");
  });
});

describe("generateFallbackBranchName", () => {
  it("uses provided type if valid", () => {
    const result = generateFallbackBranchName({
      id: "task-123",
      title: "Fix login bug",
      type: "fix",
    });
    expect(result.type).toBe("fix");
    expect(result.branch).toMatch(/^fix\//);
  });

  it("defaults to feat if type not provided", () => {
    const result = generateFallbackBranchName({
      id: "task-123",
      title: "Add OAuth",
    });
    expect(result.type).toBe("feat");
    expect(result.branch).toMatch(/^feat\//);
  });

  it("defaults to feat if type is invalid", () => {
    const result = generateFallbackBranchName({
      id: "task-123",
      title: "Add OAuth",
      type: "invalid", // invalid type should fallback to feat
    });
    expect(result.type).toBe("feat");
  });

  it("generates correct format with task id and title", () => {
    const result = generateFallbackBranchName({
      id: "task-123",
      title: "Add OAuth Login",
    });
    expect(result.branch).toBe("feat/task-123-add-oauth-login");
    expect(result.slug).toBe("task-123-add-oauth-login");
  });

  it("handles all valid branch types", () => {
    const types = ["feat", "fix", "refactor", "docs", "chore", "test"] as const;
    for (const type of types) {
      const result = generateFallbackBranchName({
        id: "t-1",
        title: "Test",
        type,
      });
      expect(result.type).toBe(type);
      expect(result.branch).toMatch(new RegExp(`^${type}/`));
    }
  });

  it("truncates long titles", () => {
    const longTitle = "A".repeat(100);
    const result = generateFallbackBranchName({
      id: "task-1",
      title: longTitle,
    });
    expect(result.slug.length).toBeLessThanOrEqual(40);
  });
});

describe("generateBranchNameWithAI", () => {
  let mockClient: OpenCodeClient;

  beforeEach(() => {
    mockClient = {
      session: {
        prompt: vi.fn(),
      },
    };
  });

  it("returns valid result from AI", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [
        { type: "text", text: '{"type": "feat", "slug": "add-oauth-login"}' },
      ],
    });

    const result = await generateBranchNameWithAI(
      { id: "task-1", title: "Add OAuth" },
      mockClient,
      "session-1",
    );

    expect(result.type).toBe("feat");
    expect(result.slug).toBe("add-oauth-login");
    expect(result.branch).toBe("feat/add-oauth-login");
  });

  it("handles AI response with prefill continuation", async () => {
    // When using prefill '{"type":"', AI might continue with just 'feat",...'
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [{ type: "text", text: 'feat", "slug": "fix-memory-leak"}' }],
    });

    const result = await generateBranchNameWithAI(
      { id: "task-1", title: "Fix memory leak" },
      mockClient,
      "session-1",
    );

    expect(result.type).toBe("feat");
    expect(result.slug).toBe("fix-memory-leak");
  });

  it("handles response wrapped in markdown code block", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [
        {
          type: "text",
          text: '```json\n{"type": "fix", "slug": "resolve-crash"}\n```',
        },
      ],
    });

    const result = await generateBranchNameWithAI(
      { id: "task-1", title: "Fix crash" },
      mockClient,
      "session-1",
    );

    expect(result.type).toBe("fix");
    expect(result.slug).toBe("resolve-crash");
  });

  it("sanitizes slug from AI response", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [
        {
          type: "text",
          text: '{"type": "feat", "slug": "Add OAuth Login!!!"}',
        },
      ],
    });

    const result = await generateBranchNameWithAI(
      { id: "task-1", title: "Add OAuth" },
      mockClient,
      "session-1",
    );

    expect(result.slug).toBe("add-oauth-login");
    expect(result.branch).toBe("feat/add-oauth-login");
  });

  it("throws error when no text in response", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [],
    });

    await expect(
      generateBranchNameWithAI(
        { id: "task-1", title: "Test" },
        mockClient,
        "session-1",
      ),
    ).rejects.toThrow("No text response from AI");
  });

  it("throws error when response cannot be parsed as JSON", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [{ type: "text", text: "This is not JSON at all" }],
    });

    // The function will try to reconstruct JSON but fail during parsing
    await expect(
      generateBranchNameWithAI(
        { id: "task-1", title: "Test" },
        mockClient,
        "session-1",
      ),
    ).rejects.toThrow(); // JSON.parse will throw
  });

  it("throws error when JSON has invalid type", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [
        { type: "text", text: '{"type": "invalid", "slug": "test-slug"}' },
      ],
    });

    await expect(
      generateBranchNameWithAI(
        { id: "task-1", title: "Test" },
        mockClient,
        "session-1",
      ),
    ).rejects.toThrow();
  });

  it("sends correct prompt to AI", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [{ type: "text", text: '{"type": "feat", "slug": "test"}' }],
    });

    await generateBranchNameWithAI(
      {
        id: "task-123",
        title: "Add feature",
        description: "A detailed description",
      },
      mockClient,
      "session-abc",
    );

    expect(mockClient.session.prompt).toHaveBeenCalledWith({
      path: { id: "session-abc" },
      body: {
        parts: [
          {
            type: "text",
            text: expect.stringContaining("task-123"),
          },
        ],
        assistant: { prefill: '{"type":"' },
      },
    });

    const callArgs = vi.mocked(mockClient.session.prompt).mock.calls[0][0];
    expect(callArgs.body.parts[0].text).toContain("Add feature");
    expect(callArgs.body.parts[0].text).toContain("A detailed description");
  });
});

describe("generateBranchName", () => {
  let mockClient: OpenCodeClient;

  beforeEach(() => {
    mockClient = {
      session: {
        prompt: vi.fn(),
      },
    };
  });

  it("validates input context", async () => {
    await expect(
      generateBranchName({ id: "", title: "Test" }),
    ).rejects.toThrow();

    await expect(
      generateBranchName({ id: "task-1", title: "" }),
    ).rejects.toThrow();
  });

  it("uses AI when client and sessionId provided", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [
        { type: "text", text: '{"type": "fix", "slug": "ai-generated"}' },
      ],
    });

    const result = await generateBranchName(
      { id: "task-1", title: "Fix bug" },
      mockClient,
      "session-1",
    );

    expect(result.slug).toBe("ai-generated");
    expect(mockClient.session.prompt).toHaveBeenCalled();
  });

  it("uses fallback when no client provided", async () => {
    const result = await generateBranchName({
      id: "task-1",
      title: "Add feature",
    });

    expect(result.branch).toBe("feat/task-1-add-feature");
    expect(mockClient.session.prompt).not.toHaveBeenCalled();
  });

  it("uses fallback when no sessionId provided", async () => {
    const result = await generateBranchName(
      { id: "task-1", title: "Add feature" },
      mockClient,
    );

    expect(result.branch).toBe("feat/task-1-add-feature");
    expect(mockClient.session.prompt).not.toHaveBeenCalled();
  });

  it("falls back to deterministic naming when AI fails", async () => {
    vi.mocked(mockClient.session.prompt).mockRejectedValueOnce(
      new Error("API Error"),
    );

    // Spy on console.warn
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await generateBranchName(
      { id: "task-1", title: "Fix bug", type: "fix" },
      mockClient,
      "session-1",
    );

    expect(result.type).toBe("fix");
    expect(result.branch).toMatch(/^fix\/task-1/);
    expect(warnSpy).toHaveBeenCalledWith(
      "[transmute] AI branch naming failed, using fallback:",
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });

  it("falls back when AI returns invalid JSON", async () => {
    vi.mocked(mockClient.session.prompt).mockResolvedValueOnce({
      parts: [{ type: "text", text: "Not valid JSON at all" }],
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await generateBranchName(
      { id: "task-1", title: "Add feature" },
      mockClient,
      "session-1",
    );

    expect(result.branch).toBe("feat/task-1-add-feature");
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe("TaskContext validation", () => {
  it("accepts valid context with all fields", async () => {
    const context: TaskContext = {
      id: "task-123",
      title: "Implement feature",
      description: "A detailed description",
      priority: "high",
      type: "feat",
    };

    const result = await generateBranchName(context);
    expect(result).toBeDefined();
  });

  it("accepts minimal context", async () => {
    const result = await generateBranchName({
      id: "t-1",
      title: "Test",
    });
    expect(result).toBeDefined();
  });
});

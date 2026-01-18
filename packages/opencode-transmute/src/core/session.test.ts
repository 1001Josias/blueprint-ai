import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadState,
  saveState,
  addSession,
  removeSession,
  findSessionByTask,
  createEmptyState,
  getStateFilePath,
  getStateDir,
  sessionSchema,
  stateSchema,
  type Session,
  type State,
} from "./session";
import * as fs from "node:fs/promises";

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
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

// Helper to create a valid session
function createTestSession(overrides: Partial<Session> = {}): Session {
  return {
    taskId: "task-123",
    taskName: "Test Task",
    branch: "feat/test-task",
    worktreePath: "/repo/worktrees/feat-test-task",
    createdAt: "2026-01-17T10:30:00Z",
    opencodeSessionId: "ses_abc123def456",
    ...overrides,
  };
}

// Helper to create a valid state
function createTestState(sessions: Session[] = []): State {
  return { sessions };
}

describe("sessionSchema", () => {
  it("validates a valid session", () => {
    const session = createTestSession();
    const result = sessionSchema.parse(session);
    expect(result).toEqual(session);
  });

  it("requires all fields", () => {
    const incomplete = {
      taskId: "task-123",
      taskName: "Test",
      // missing branch, worktreePath, createdAt, opencodeSessionId
    };
    expect(() => sessionSchema.parse(incomplete)).toThrow();
  });

  it("requires opencodeSessionId to be a string", () => {
    const session = createTestSession();
    // @ts-expect-error Testing invalid type
    session.opencodeSessionId = 123;
    expect(() => sessionSchema.parse(session)).toThrow();
  });

  it("validates createdAt as ISO datetime", () => {
    const session = createTestSession({ createdAt: "invalid-date" });
    expect(() => sessionSchema.parse(session)).toThrow();
  });
});

describe("stateSchema", () => {
  it("validates an empty state", () => {
    const state = createEmptyState();
    const result = stateSchema.parse(state);
    expect(result.sessions).toEqual([]);
  });

  it("validates a state with sessions", () => {
    const state = createTestState([createTestSession()]);
    const result = stateSchema.parse(state);
    expect(result.sessions).toHaveLength(1);
  });
});

describe("getStateFilePath", () => {
  it("returns correct path", () => {
    expect(getStateFilePath("/repo")).toBe(
      "/repo/.opencode/transmute.sessions.json",
    );
  });

  it("handles trailing slash", () => {
    expect(getStateFilePath("/repo/")).toBe(
      "/repo/.opencode/transmute.sessions.json",
    );
  });
});

describe("getStateDir", () => {
  it("returns correct directory", () => {
    expect(getStateDir("/repo")).toBe("/repo/.opencode");
  });
});

describe("loadState", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty state when file does not exist", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(createNodeError("ENOENT"));

    const result = await loadState("/repo");

    expect(result).toEqual({ sessions: [] });
    expect(fs.readFile).toHaveBeenCalledWith(
      "/repo/.opencode/transmute.sessions.json",
      "utf-8",
    );
  });

  it("parses valid JSON file", async () => {
    const state = createTestState([createTestSession()]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(state));

    const result = await loadState("/repo");

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].taskId).toBe("task-123");
  });

  it("throws on invalid JSON", async () => {
    vi.mocked(fs.readFile).mockResolvedValue("{ invalid json }");

    await expect(loadState("/repo")).rejects.toThrow("Invalid JSON");
  });

  it("throws on invalid state structure", async () => {
    const invalidState = { sessions: [{ taskId: "only-partial" }] };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidState));

    await expect(loadState("/repo")).rejects.toThrow();
  });

  it("throws on non-ENOENT file errors", async () => {
    const error = createNodeError("EACCES", "Permission denied");
    vi.mocked(fs.readFile).mockRejectedValue(error);

    await expect(loadState("/repo")).rejects.toThrow("Permission denied");
  });
});

describe("saveState", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it("creates .opencode directory", async () => {
    const state = createTestState();

    await saveState("/repo", state);

    expect(fs.mkdir).toHaveBeenCalledWith("/repo/.opencode", {
      recursive: true,
    });
  });

  it("writes formatted JSON", async () => {
    const state = createTestState([createTestSession()]);

    await saveState("/repo", state);

    expect(fs.writeFile).toHaveBeenCalledWith(
      "/repo/.opencode/transmute.sessions.json",
      JSON.stringify(state, null, 2),
      "utf-8",
    );
  });

  it("validates state before saving", async () => {
    const invalidState = { sessions: "not-an-array" } as unknown as State;

    await expect(saveState("/repo", invalidState)).rejects.toThrow();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it("validates sessions in state", async () => {
    const stateWithInvalidSession = {
      sessions: [{ taskId: "partial" }],
    } as unknown as State;

    await expect(saveState("/repo", stateWithInvalidSession)).rejects.toThrow();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

describe("addSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it("adds session to empty state", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(createNodeError("ENOENT"));
    const session = createTestSession();

    await addSession("/repo", session);

    const expectedState = createTestState([session]);
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/repo/.opencode/transmute.sessions.json",
      JSON.stringify(expectedState, null, 2),
      "utf-8",
    );
  });

  it("adds session to existing state", async () => {
    const existingSession = createTestSession({ taskId: "existing-task" });
    const existingState = createTestState([existingSession]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingState));

    const newSession = createTestSession({ taskId: "new-task" });
    await addSession("/repo", newSession);

    expect(fs.writeFile).toHaveBeenCalled();
    const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    const writtenState = JSON.parse(writtenContent);
    expect(writtenState.sessions).toHaveLength(2);
  });

  it("replaces session with same taskId", async () => {
    const existingSession = createTestSession({
      taskId: "task-123",
      branch: "old-branch",
    });
    const existingState = createTestState([existingSession]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingState));

    const updatedSession = createTestSession({
      taskId: "task-123",
      branch: "new-branch",
    });
    await addSession("/repo", updatedSession);

    expect(fs.writeFile).toHaveBeenCalled();
    const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    const writtenState = JSON.parse(writtenContent);
    expect(writtenState.sessions).toHaveLength(1);
    expect(writtenState.sessions[0].branch).toBe("new-branch");
  });

  it("validates session before adding", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(createNodeError("ENOENT"));
    const invalidSession = { taskId: "partial" } as unknown as Session;

    await expect(addSession("/repo", invalidSession)).rejects.toThrow();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

describe("removeSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it("removes existing session", async () => {
    const session1 = createTestSession({ taskId: "task-1" });
    const session2 = createTestSession({ taskId: "task-2" });
    const existingState = createTestState([session1, session2]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingState));

    await removeSession("/repo", "task-1");

    expect(fs.writeFile).toHaveBeenCalled();
    const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    const writtenState = JSON.parse(writtenContent);
    expect(writtenState.sessions).toHaveLength(1);
    expect(writtenState.sessions[0].taskId).toBe("task-2");
  });

  it("does nothing when session does not exist", async () => {
    const session = createTestSession({ taskId: "task-1" });
    const existingState = createTestState([session]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingState));

    await removeSession("/repo", "nonexistent-task");

    expect(fs.writeFile).toHaveBeenCalled();
    const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    const writtenState = JSON.parse(writtenContent);
    expect(writtenState.sessions).toHaveLength(1);
  });

  it("handles empty state", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(createNodeError("ENOENT"));

    await removeSession("/repo", "any-task");

    expect(fs.writeFile).toHaveBeenCalled();
    const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    const writtenState = JSON.parse(writtenContent);
    expect(writtenState.sessions).toHaveLength(0);
  });
});

describe("findSessionByTask", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("finds existing session", async () => {
    const session = createTestSession({ taskId: "task-123" });
    const state = createTestState([session]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(state));

    const result = await findSessionByTask("/repo", "task-123");

    expect(result).toBeDefined();
    expect(result?.taskId).toBe("task-123");
    expect(result?.opencodeSessionId).toBe("ses_abc123def456");
  });

  it("returns undefined when session not found", async () => {
    const session = createTestSession({ taskId: "task-123" });
    const state = createTestState([session]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(state));

    const result = await findSessionByTask("/repo", "nonexistent");

    expect(result).toBeUndefined();
  });

  it("returns undefined for empty state", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(createNodeError("ENOENT"));

    const result = await findSessionByTask("/repo", "any-task");

    expect(result).toBeUndefined();
  });

  it("finds correct session among multiple", async () => {
    const session1 = createTestSession({
      taskId: "task-1",
      opencodeSessionId: "ses_111",
    });
    const session2 = createTestSession({
      taskId: "task-2",
      opencodeSessionId: "ses_222",
    });
    const session3 = createTestSession({
      taskId: "task-3",
      opencodeSessionId: "ses_333",
    });
    const state = createTestState([session1, session2, session3]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(state));

    const result = await findSessionByTask("/repo", "task-2");

    expect(result?.opencodeSessionId).toBe("ses_222");
  });
});

describe("createEmptyState", () => {
  it("returns empty sessions array", () => {
    const state = createEmptyState();
    expect(state.sessions).toEqual([]);
  });

  it("returns new object each time", () => {
    const state1 = createEmptyState();
    const state2 = createEmptyState();
    expect(state1).not.toBe(state2);
  });
});

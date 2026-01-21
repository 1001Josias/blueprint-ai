# AGENTS.md

Instructions for AI coding agents working on Transmute.

## Project Overview

Transmute is a task management system where AI agents generate PRDs (Product Requirements Documents) and based on PRDs, generate tasks in markdown format, that are rendered in a Next.js web app with a premium UI.

## Setup Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint
```

## Code Style

- TypeScript strict mode
- Use functional React components
- Tailwind CSS for styling (use `cn()` utility from `@/lib/utils` for class merging)
- Zod for schema validation
- File naming: kebab-case for files, PascalCase for components

## Project Structure

```
transmute/
├── projects/                  # Markdown content (PRDs + Tasks)
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   └── lib/                   # Utilities (schemas, markdown parser)
└── docs/                      # Documentation
```

## Creating Projects (PRD + Tasks)

Create files in `projects/<project-slug>/`:

### PRD (`prd.md`)

```markdown
---
id: "project-slug"
title: "Project Title"
status: "draft" # draft | in_review | approved | rejected
version: "1.0"
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
author: "ai-agent"
---

# Project Title

## Objetivo

Description of the goal...

## Requisitos Funcionais

1. Requirement 1
2. Requirement 2
```

### Tasks (`tasks.md`)

```markdown
---
project_id: "project-slug"
prd_version: "1.0"
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
---

# Tasks: Project Title

## Task 1: Task Title

- **id:** task-001
- **status:** todo # todo | in_progress | done | blocked
- **priority:** high # low | medium | high | critical
- **description:** Clear description of the task.

### Subtasks

#### [ ] Subtask Title

Description of the subtask.

#### [x] Completed Subtask

This subtask is done.
```

## Workflow

1. Create `prd.md` with status `draft`
2. User reviews and approves (status → `approved`)
3. Generate `tasks.md` based on approved PRD
4. Update `updated_at` when modifying files with current date
5. **System Documentation**: When modifying the **Transmute codebase** (e.g., adding features, updating APIs, changing schemas), you MUST check and update `apps/docs` to reflect these changes. This ensures the system documentation remains accurate.
6. **Task Execution & Isolation**:
   - Treat each Task as a specific **deliverable** (analogous to a git branch).
   - **Work on ONLY ONE task per session**.
   - **STOP** after completing and verifying your SINGLE assigned task. Do NOT automatically proceed to the next task in the list. This avoids race conditions where multiple agents might accidentally duplicate work on the same future tasks.

7. **Ambiguity Resolution - "Create Tasks"**:
   - If a user asks to "create tasks", "register tasks", or "add pending items", they almost always mean creating or updating a `tasks.md` file within the `projects/` structure (the System).
   - Do NOT create a local/temporary todo list unless explicitly asked for a personal plan.
   - If the specific workspace or project mentioned does not exist in `projects/`, you should CREATE the necessary directory structure and files (`prd.md` and `tasks.md`).

8. **Task Status Tracking**:
   - When starting a task, update its status to `in_progress`.
   - When completing a task or subtask, mark it as completed (update status to `done` or check the box `[x]`).
   - **Verification**: If you are unsure about the completion (e.g., logically uncertain or low confidence in implementation), ASK the user for confirmation BEFORE marking the task as `done`.
   - **Traceability**:
     - When a subtask is completed, append the commit link: `[x] Subtask Title ([commit-hash](url))`
     - When the main task is completed, append the PR link: `**PR:** [PR Title](url)`

9. **Scope Changes**:
   - If the user requests additional features or modifications to work that has already been **committed and marked as done**, do NOT reopen the old task.
   - Instead, **create a new task or subtask** to track this new request.

10. **Handling Blockers**:
    - If a task is blocked (e.g., missing credentials, external dependency bug), explicitly update its status to `blocked` (`status: blocked`).
    - Add a clear note explaining the reason using a comment: `- **comment:** Blocked because...`.

11. **Discovered Technical Work**:
    - If you discover technical prerequisites (e.g., refactoring, extra configuration) that were not in the original plan:
    - **Add them as new subtasks** in `tasks.md` BEFORE executing them.
    - This ensures the plan remains a true reflection of the work being done.

12. **Concurrent Work Warning**:
    - If you notice that other tasks in `tasks.md` are marked as `in_progress` while you are starting a new one, **notify the user**.
    - Ask if this is intentional or if the previous task should be marked as done/blocked. This avoids "zombie tasks" that remain in progress indefinitely.

13. **General Comments**:
    - Use comments (`- **comment:** <text>`) to add context, observations, or important details to any task or subtask.
    - This creates a centralized log of important information directly in the task definition.

14. **Verify Existing Implementation**:
    - Before starting a task marked as `in_progress`, **verify if the code already exists**.
    - Compare the scope of subtasks with the current state of the codebase.
    - If the implementation is already complete, update the task status to `done` and document what was found.

15. **Read vs Read-Write Scope**:
    - When defining UI-related tasks, explicitly specify the interaction level:
      - **R (Read-only)**: Display/render data only
      - **RW (Read-Write)**: Full CRUD operations (create, edit, delete)
    - This avoids ambiguity about whether "support for X" means just displaying or also mutating.

16. **UX Decision Mockups**:
    - When facing UX decisions with multiple valid approaches, **generate visual mockups** to help the user decide.
    - Use image generation tools to create quick wireframes or concepts.
    - Present options with pros/cons for informed decision-making.

17. **Scope Creep Threshold**:
    - If new requirements exceed **3x the original scope** of a task, create a **new project** instead of expanding the existing task.
    - Signs of scope creep: new components, new API endpoints, new integrations not in the original plan.
    - This keeps tasks focused and deliverables manageable.

18. **Registering Future Improvements**:
    - When the user discusses potential features, improvements, or ideas for the future, **ask if they want you to create a task/project** to track it.
    - Do NOT create tasks automatically — always confirm first: "Would you like me to create a task/project in `projects/` to track this for later?"
    - This ensures ideas are captured without cluttering the backlog with unwanted items.

19. **Unit Testing Proposals**:
    - After completing an implementation, **ASK the user** if the feature is fully complete and if they would like you to create unit tests.
    - Do NOT assume the implementation is final without confirmation.
    - Do NOT create tests automatically — always propose first: "Implementation seems complete. Shall I add unit tests for this feature now?"

20. **Final Response Links**:
    - When confirming a task is completed in your final response to the user, **ALWAYS** include:
      - The **Localhost UI Link** to the task (e.g., `http://localhost:3000/projects/<workspace>/<project-slug>?task=<task-id>`)
      - The Pull Request URL (if applicable)
    - This allows the user to immediately verify the changes in the browser.

21. **Conflicting Specifications**:
    - When PRD and Task definitions conflict regarding implementation details (e.g., file paths, technology choices, scope, architecture), **ALWAYS ask the user** which source to follow.
    - Do NOT assume one is more correct than the other — the user has context that resolves the ambiguity.
    - Example: "I noticed the PRD specifies `apps/opencode-transmute` but the Task says `packages/opencode-transmute`. Which location should I use?"

## State Management Guidelines

To ensure consistency and correct behavior across the application, follow these boundaries for state management:

### 1. URL State (nuqs)

**Use for:** Shareable, bookmarkable, or deep-linkable state.

- **Filters/Sorts:** List filters (e.g., `?status=done`), sorting preferences.
- **Selection:** Currently selected item (e.g., `?task=task-123`).
- **Pagination:** Current page number (e.g., `?page=2`).
- **View Modes:** Tabs or view toggles that affect the main content (e.g., `?view=calendar`).

**Pattern:** Create a custom hook in `@/lib/search-params.ts` to wrap `useQueryState`.

```typescript
// @/lib/search-params.ts
export function useTaskSearchParams() {
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsString.withDefault("all"),
  );
  return { filter, setFilter };
}
```

### 2. Application State (Zustand)

**Use for:** Global app state, server cache, or user preferences that shouldn't be in the URL.

- **Server Cache:** Optimistic updates, data cache (e.g., `optimisticStatus`).
- **UI State (Ephemeral):** Loading states, pending flags, drag-and-drop intermediate state.
- **UI Preferences (Persisted):** Sidebar collapse state, theme preference, "Show archived" sidebar toggle (if tailored to user).

**Pattern:** Create feature-specific stores in `@/lib/stores/`.

```typescript
// @/lib/stores/ui-store.ts
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: "ui-store" },
  ),
);
```

### 3. Integration Logic

- **Do NOT duplicate URL state in Zustand** unless absolutely necessary (e.g., complex derived state that needs to be accessed outside React tree - rare).
- **Read-Write separation:** Components should read from URL hooks for rendering and write to URL hooks for user actions.
- **Syncing:** If an optimistic update needs to reflect immediately while the server processes, store the _pending_ state in Zustand, but the _source of truth_ for the initial view remains the server data + URL params. (See `useTaskStore.optimisticStatus`).

## Git Conventions

- **Always start from updated main**: Before starting any new task, checkout `main`, pull latest changes (`git checkout main && git pull`), then create a new feature branch.
- Branch naming: `feat/<feature>`, `fix/<issue>`, `docs/<topic>`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Always create PR for changes (don't push directly to main)
- Run `pnpm lint` and `pnpm build` before committing

## PR Instructions

- Title format: `<type>: <description>` (e.g., `feat: add task filtering`)
- Include description of changes
- Reference related issues if applicable

## Post-Task Learning

After completing a task and creating the PR, the agent MUST perform a **learning reflection**:

1. **Reflect on the session**: Consider what was discussed beyond the code itself:
   - Did the user clarify expectations about how agents should behave?
   - Were there misunderstandings about scope, priorities, or conventions?
   - Did the user express preferences about workflow, communication, or decision-making?

2. **Identify project-level guidelines**: Focus on insights that affect **how agents work on this project**, not specific technical implementations. Examples:
   - "Always ask for clarification before starting tasks with ambiguous scope"
   - "Create a new project in `projects/` for features that span multiple sessions"
   - "Prefer creating tasks for future work instead of implementing immediately"
   - "When debugging, investigate root causes before applying quick fixes"

3. **Propose the guideline to the user**: If you identify something worth adding:
   - **ASK the user**: "During this session, I noticed [X]. Would you like me to add a guideline to `AGENTS.md` to ensure future agents follow this pattern?"
   - Only add the guideline after user approval.
   - Be concise — propose a one-liner or short paragraph, not a full essay.

4. **Where to add guidelines**:
   - `AGENTS.md` (root) — for general agent behavior across the project
   - App-specific `AGENTS.md` — for patterns specific to `apps/web`, `apps/docs`, etc.
   - `.agent/workflows/` — for repeatable multi-step processes

> **Goal**: Each session should leave behind wisdom for future agents. The guidelines file is a living document that evolves with practical experience.

## PRD Planning

### Confirm Design Decisions

When creating PRDs, do not assume design decisions without confirming with the user. Examples of points that require confirmation:

- AI-generated data vs deterministic logic
- Choice of specific technologies/tools
- Scope trade-offs (MVP vs post-MVP)
- Code location in the monorepo (apps/ vs packages/)

Ask explicitly before finalizing the document.

### Use Interactive Mode for Decisions

When there are design decisions that need explicit user input, **use the terminal interactive mode** (`question` tool) to present the options.

Examples of when to use:

- Choosing between technical approaches (AI vs deterministic)
- Defining scope (MVP vs post-MVP)
- Selecting technologies/tools
- Deciding code location in the monorepo

This ensures the user makes informed decisions before proceeding.

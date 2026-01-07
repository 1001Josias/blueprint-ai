# AGENTS.md

Instructions for AI coding agents working on BlueprintAI.

## Project Overview

BlueprintAI is a task management system where AI agents generate PRDs (Product Requirements Documents) and based on PRDs, generate tasks in markdown format, that are rendered in a Next.js web app with a premium UI.

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
blueprint-ai/
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
status: "draft"           # draft | in_review | approved | rejected
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
- **status:** todo          # todo | in_progress | done | blocked
- **priority:** high        # low | medium | high | critical
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
5. **System Documentation**: When modifying the **BlueprintAI codebase** (e.g., adding features, updating APIs, changing schemas), you MUST check and update `apps/docs` to reflect these changes. This ensures the system documentation remains accurate.
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

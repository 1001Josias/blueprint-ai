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

## Git Conventions

- Branch naming: `feat/<feature>`, `fix/<issue>`, `docs/<topic>`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Always create PR for changes (don't push directly to main)
- Run `pnpm lint` and `pnpm build` before committing

## PR Instructions

- Title format: `<type>: <description>` (e.g., `feat: add task filtering`)
- Include description of changes
- Reference related issues if applicable

---
project_id: agent-guidelines
prd_version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
---

# Tasks: Agent Guidelines Improvements

## Task 1: Update AGENTS.md Guidelines

- **id:** task-001
- **status:** done
- **priority:** high
- **description:** Add new rules for status tracking, scope changes, blockers, and discovered work.
- **comment:** Guidelines updated and verified with user.

### Subtasks

#### [x] Add Status Tracking & Verification Rules

Updated AGENTS.md with rules 8 (Status Tracking) and verification check.

#### [x] Add Scope Change Rules

Updated AGENTS.md with rule 9 (Scope Changes).

#### [x] Add Blocker & Discovered Work Rules

Updated AGENTS.md with rules 10 (Blockers) and 11 (Discovered Technical Work).

#### [x] Add Concurrent Work Warning

Updated AGENTS.md with rule 12 (Concurrent Work Warning).

## Task 2: Implement Generic Task Comments

- **id:** task-002
- **status:** done
- **priority:** high
- **description:** Implement support for generic comments in tasks and subtasks to replace specific blocker reasons.
- **comment:** All components already implemented. Verified working on 2026-01-07.
- **comment:** Test comment from UI

### Subtasks

#### [x] Update Shared Schema

`packages/schemas/src/index.ts` already has `comments: z.array(z.string()).default([])` in both `taskSchema` and `subtaskSchema`.

#### [x] Update Markdown Parser

`apps/web/src/lib/markdown.ts` already parses `- **comment:** ...` lines for both tasks and subtasks.

#### [x] Update UI Component

`apps/web/src/components/task-item.tsx` already displays comments with 💬 emoji for both tasks and subtasks.

#### [x] Update AGENTS.md Documentation

Rule 13 in `AGENTS.md` documents the generic comment format (`- **comment:** <text>`).

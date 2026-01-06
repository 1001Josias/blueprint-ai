---
project_id: task-dependencies
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: Task Dependencies Strategies

## Task 1: Schema and Parser Update
- **id:** task-dep-101
- **status:** todo
- **priority:** critical
- **description:** Update the core data structures to support dependencies.

### Subtasks

#### [ ] Update Zod Schema
Modify `@repo/schemas` (and `apps/web/src/lib/schemas.ts`) to include `dependencies: string[]` (optional) in `taskSchema`.

#### [ ] Update Markdown Parser
Modify `apps/web/src/lib/markdown.ts` logic to parse the line `- **dependencies:** task-id, task-id-2`.

---

## Task 2: UI Implementation
- **id:** task-dep-102
- **status:** todo
- **priority:** high
- **description:** Visualize and Enforce dependencies in the Frontend.

### Subtasks

#### [ ] Visual Indicator
Add a "Blocked" badge or icon to Task Cards that have incomplete dependencies.

#### [ ] Status Change Guard
Modify the "Toggle Status" function/component to check dependencies. If blocked, show a toast/alert and do not change status.

#### [ ] Dependency List
Display the list of blocking task IDs (and ideally their titles) in the expanded view of the Task.

---

## Task 3: Verification
- **id:** task-dep-103
- **status:** todo
- **priority:** medium
- **description:** Ensure logic correctness.

### Subtasks

#### [ ] Test Standard Flow
Create Task A and Task B (dependent on A). Verify B cannot be started. Complete A. Verify B can be started.

#### [ ] Test Circular Dependency
Attempt to make A depend on B and B depend on A (via Markdown). Ensure parser/UI doesn't crash (circular detection might be advanced, but basic stability is required).

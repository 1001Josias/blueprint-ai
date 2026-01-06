---
project_id: task-definition
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: Advanced Task Definition & Schema

## Task 1: Schema Updates
- **id:** task-def-101
- **status:** todo
- **priority:** high
- **description:** Update Zod schemas and Types.

### Subtasks

#### [ ] Update core schemas
Add `type`, `effort`, `dueDate`, `acceptance_criteria` to `taskSchema` in `@repo/schemas`.

#### [ ] Update Markdown Parser
Implement logic to parse these new fields.
*Proposal*:
```markdown
- **type:** feature
- **effort:** M
- **acceptance_criteria:**
  - [ ] User can click button
  - [ ] Data is saved
```

---

## Task 2: UI Implementation
- **id:** task-def-102
- **status:** todo
- **priority:** medium
- **description:** Display the new fields.

### Subtasks

#### [ ] Update Task Card
Show Type icon and Effort badge.

#### [ ] Render Acceptance Criteria
Show a mini-checklist inside the task details.

---

## Task 3: Description Template Logic
- **id:** task-def-103
- **status:** todo
- **priority:** medium
- **description:** Standardize the text body.

### Subtasks

#### [ ] Update Parser
Ensure `markdown.ts` extracts the description body correctly even with the new metadata fields.

#### [ ] Linter/Warning
If a task description doesn't contain the standard headers (Context, Implementation, Verification), show a warning in the UI/Console (optional MVP).

---
project_id: ui-editing
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: UI Editing & Interactivity

## Task 1: Task Mutation API
- **id:** task-edit-101
- **status:** todo
- **priority:** high
- **description:** API endpoints to modify markdown files safely.

### Subtasks

#### [ ] Implement Update Task Endpoint
`PATCH /api/projects/:slug/tasks/:taskId` to update status/priority.

#### [ ] Implement Create Task Endpoint
`POST /api/projects/:slug/tasks` to append new tasks.

#### [ ] Implement Delete Task Endpoint
`DELETE /api/projects/:slug/tasks/:taskId`.

---

## Task 2: Frontend Interactivity
- **id:** task-edit-102
- **status:** todo
- **priority:** high
- **description:** UI components for editing.

### Subtasks

#### [ ] Status Toggle
Make checkbox/status badge clickable to cycle statuses.

#### [ ] Edit Modal
Create a form (React Hook Form + Zod) to edit task details.

#### [ ] Create Project Wizard
Multi-step modal to define PRD and initial tasks.

---

## Task 3: i18n Support
- **id:** task-edit-103
- **status:** todo
- **priority:** medium
- **description:** Internationalization infrastructure.

### Subtasks

#### [ ] Setup next-intl or similar
Configure localization routing.

#### [ ] Translate UI Shell
Extract hardcoded strings to locale files (status labels, sidebar, headers).

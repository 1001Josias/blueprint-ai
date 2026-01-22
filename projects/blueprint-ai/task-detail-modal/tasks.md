---
project_id: "task-detail-modal"
prd_version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
---

# Tasks: Task Detail Modal

## Task 1: Modal Base Structure

- **id:** tdm-001
- **status:** done
- **priority:** high
- **description:** Create the base modal component with task details display.

### Subtasks

#### [x] Create TaskDetailModal component

New component using Radix Dialog or Sheet.

#### [x] Simplify TaskItem card

Remove inline comments/subtasks, add click handler to open modal.

#### [x] Display task info in modal

Title, status badge, priority badge, description.

#### [x] Subtasks section in modal

List subtasks with toggle functionality.

#### [x] Comments section in modal

Display all comments with timestamps.

#### [x] Deep linking support

URL query param `?task=task-id` to open modal on page load.

---

## Task 2: Rich Text Support

- **id:** tdm-002
- **status:** todo
- **priority:** medium
- **description:** Add rich text rendering and editing capabilities.

### Subtasks

#### [ ] Render description as markdown

Use remark/rehype or similar to convert markdown to HTML.

#### [ ] Add formatting toolbar for comments

Buttons for bold, italic, underline, link, code.

#### [ ] Store comments as markdown

Update parser and schema if needed.

---

## Task 3: Comments CRUD

- **id:** tdm-003
- **status:** todo
- **priority:** high
- **description:** Full create, read, update, delete for comments.

### Subtasks

#### [ ] Edit comment functionality

Inline edit mode with Save/Cancel.

#### [ ] Delete comment functionality

Confirmation dialog before deletion.

#### [ ] Action menu on hover

Three-dot menu (⋮) with Edit, Delete, Improve with AI options.

#### [ ] Update API endpoint

Extend PATCH to support edit/delete operations.

---

## Task 4: AI Enhancement

- **id:** tdm-004
- **status:** todo
- **priority:** medium
- **description:** AI-powered comment improvement feature.

### Subtasks

#### [ ] Create AI enhancement API

Endpoint to improve text using Gemini/OpenAI.

#### [ ] Add "Improve with AI" button

Button in comment form and action menu.

#### [ ] Show loading state during AI processing

Spinner or skeleton while waiting for response.

#### [ ] Preview and confirm AI suggestions

Show improved text with option to accept or reject.

---
project_id: "task-attachments"
prd_version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
---

# Tasks: Task Attachments

## Task 1: Schema & Parser Updates

- **id:** att-001
- **status:** todo
- **priority:** high
- **description:** Add attachments support to schema and markdown parser. (RW)

### Subtasks

#### [ ] Add attachments field to taskSchema

Array of `{ url: string, alt: string, type: "image" | "file" }`.

#### [ ] Update markdown parser

Detect `![alt](path)` syntax and extract to attachments array.

#### [ ] Create assets directory convention

Document `projects/<slug>/assets/` as standard location.

---

## Task 2: UI Display

- **id:** att-002
- **status:** todo
- **priority:** high
- **description:** Display attachments in UI. (R)

### Subtasks

#### [ ] Render images in task description

Already works via remark-html, verify rendering.

#### [ ] Attachments gallery in modal

Grid of thumbnails in Task Detail Modal.

#### [ ] Lightbox component

Click to view full-size image with zoom.

---

## Task 3: Upload Feature

- **id:** att-003
- **status:** todo
- **priority:** medium
- **description:** Allow uploading new attachments. (RW)

### Subtasks

#### [ ] Create upload API endpoint

`POST /api/projects/:slug/assets` to receive files.

#### [ ] Drag & drop zone in modal

Drop area to upload images.

#### [ ] Auto-insert markdown reference

After upload, insert `![filename](assets/filename.png)` in description.

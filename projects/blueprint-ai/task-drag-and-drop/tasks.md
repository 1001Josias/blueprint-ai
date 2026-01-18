---
project_id: task-drag-and-drop
prd_version: "1.0"
created_at: "2026-01-06"
updated_at: "2026-01-06"
---

# Tasks: Drag and Drop Task Reordering

## Task 1: Frontend Drag and Drop Logic

- **id:** task-dd-101
- **status:** todo
- **priority:** high
- **description:** Implement the visual DND components using `@dnd-kit`.

### Subtasks

#### [ ] Install dependencies

Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` to `apps/web`.

#### [ ] Create SortableTask component

Wrap the existing Task Card/Row in a Sortable component that handles drag listeners.

#### [ ] Implement SortableContext

Wrap the Task List in a `SortableContext` and `DndContext`.

#### [ ] Handle DragEnd event

Implement the logic to update the local state array when a drag operation concludes.

---

## Task 2: Backend Persistence

- **id:** task-dd-102
- **status:** todo
- **priority:** high
- **description:** Create endpoint to save the new task order to the filesystem.

### Subtasks

#### [ ] Design Reorder API

Define schema for `PATCH /api/projects/:slug/tasks/reorder` accepting a list of Task IDs.

#### [ ] Implement Markdown Writer

Create a helper function in `markdown.ts` to regenerate the "Tasks" section of the markdown file based on an input array of Tasks, preserving headers and PRD content.

#### [ ] Connect Frontend to API

Call the API on `onDragEnd` (debounce if necessary or just trigger on drop).

---

## Task 3: Verification and UX Polish

- **id:** task-dd-103
- **status:** todo
- **priority:** medium
- **description:** Ensure smooth interactions and edge case handling.

### Subtasks

#### [ ] Test Formatting Preservation

Verify that reordering tasks doesn't break other parts of the `tasks.md` file (e.g. comments, PRD links).

#### [ ] Add Keyboard Support

Configure `@dnd-kit` sensors to allow keyboard reordering.

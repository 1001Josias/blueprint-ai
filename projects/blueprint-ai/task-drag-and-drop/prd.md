---
id: task-drag-and-drop
title: Drag and Drop Task Reordering
status: draft
version: "1.0"
created_at: "2026-01-06"
updated_at: "2026-01-06"
author: ai-agent
---

# Drag and Drop Task Reordering

## Objective

Enable users to reorder tasks and subtasks within the project view using intuitive drag-and-drop interactions. This feature aims to improve task management efficiency and user experience.

## Context

Currently, tasks are displayed in a static order determined by the markdown file structure. Users cannot easily prioritize or organize tasks visually without manually editing the file.

## Functional Requirements

### Interaction

1.  **Task Reordering**: Users should be able to drag a task card and drop it in a new position within the list.
2.  **Subtask Reordering**: Users should be able to reorder subtasks within a parent task.
3.  **Visual Feedback**: Show drag overlays and placement indicators during the drag operation.

### Persistence

1.  **API**: A backend endpoint must receive the new order of IDs.
2.  **Storage**: The system must rewrite the `tasks.md` file of the corresponding project to reflect the new order, preserving all task properties (status, description, etc.).

## Non-Functional Requirements

- **Performance**: UI updates must be optimistic (instant feedback) with background persistence.
- **Stability**: Ensure data is not lost if the write operation fails (handle race conditions gracefully if possible, though file-based storage has limits).
- **Accessibility**: Ensure keyboard support for reordering if possible (via `@dnd-kit`).

## Out of Scope

- Moving tasks _between_ projects (only within the same project).
- Complex nesting (subtasks of subtasks).

## Success Metrics

1.  Users can reorder tasks and see the changes persist after page reload.
2.  Markdown files remain valid and correctly formatted after reordering.

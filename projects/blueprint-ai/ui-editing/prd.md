---
id: ui-editing
title: UI Editing & Interactivity
status: draft
version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
author: ai-agent
---

# UI Editing & Interactivity

## Objective

Enable users to manage tasks and projects directly through the user interface, moving beyond read-only visualization of Markdown files.

## Context

Current version (v1.0) is read-only. Updates require manual file editing or AI agent intervention via file system. This project covers the v1.1 Roadmap items.

## Functional Requirements

1.  **Task Management**:
    -   Toggle task status (Todo <-> Done) with a click.
    -   Create new tasks and subtasks via modal/inline.
    -   Delete tasks.
    -   Edit task metadata (priority, description).
2.  **Project Management**:
    -   Create new projects (wizard to generate folder + markdown).
3.  **Internationalization**:
    -   Support switching between English and Portuguese.

## Success Metrics

1.  User can create a full project without opening a text editor.
2.  Task status changes persist to `tasks.md`.

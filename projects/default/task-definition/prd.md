---
id: task-definition
title: Advanced Task Definition & Schema
status: draft
version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
author: ai-agent
---

# Advanced Task Definition & Schema

## Objective

Standardize and enrich the structure of Task descriptions to support more rigorous engineering practices. This involves moving beyond a simple string `description` to structured fields like Acceptance Criteria, Tech Notes, and Attachments, and **enforcing a standard template for the description text itself**.

## Context

Currently, a task's description is just a blob of text. This leads to inconsistent quality and missing information (e.g., unclear "Done" definition).

## Functional Requirements

### Description Template
1.  **Standard Sections**: The body of the task description must follow a template:
    -   **Context**: Why is this needed?
    -   **Implementation Details**: Technical approach.
    -   **Verification Plan**: How to test.
2.  **Linting**: The system should warn if these headers are missing.

### Data Structure Extensions
1.  **Acceptance Criteria**: A specific list of conditions that must be met.
2.  **Type Field**: Distinguish between `Feature`, `Bug`, `Chore`, `Refactor`.
3.  **Effort/Size**: T-Shirt sizing (XS, S, M, L, XL) or Points.
4.  **Due Date**: Optional deadline.

### Visualization
1.  **Rendered View**: Display Acceptance Criteria as a checklist within the Task Card/Process.
2.  **Icons**: Visual indicators for Task Type (Bug = Red Bug Icon).

## Non-Functional Requirements

-   **Backward Compatibility**: Old tasks without these fields must still render correctly.
-   **Markdown Readability**: The persistent format in `tasks.md` must remain human-readable (e.g., using specific headers or blockquotes).

## Out of Scope

-   Custom fields (user-defined keys).

## Success Metrics

1.  Agents know exactly *when* a task is done based on structured criteria.
2.  Users can filter tasks by "Bug" or "Feature".

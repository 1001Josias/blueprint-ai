---
project_id: "state-management"
prd_version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
---

# State Management Improvements - Tasks

## Task 1: Implement nuqs for URL Query Params
- [x] Install `nuqs` package
- [x] Create query param hooks for common patterns:
  - [x] `useTaskIdParam()` - selected task ID
  - [x] `useFilterParam()` - task list filter
  - [x] `useTabParam()` - active tab selection
- [x] Refactor `TaskList` to use nuqs instead of `window.history`
- [x] Refactor `TaskDetailModal` to read task ID from nuqs
- [x] Test URL sharing and bookmarking

## Task 2: Implement Zustand for Global State
- [x] Install `zustand` package
- [x] Create stores:
  - [x] `useTaskStore` - task cache and optimistic updates
  - [x] `useUIStore` - sidebar state, modal states
- [x] Migrate optimistic update logic from components to store
- [x] Remove prop drilling for shared state
- [x] Add devtools middleware for debugging

## Task 3: Combine nuqs + Zustand
- [x] Define clear boundaries:
  - URL state (nuqs): filters, selected items, pagination
  - Memory state (Zustand): cache, loading states, UI state
- [x] Create integration patterns/hooks
- [x] Document state management conventions in AGENTS.md

**PR:** [feat: state management guidelines and lint fixes](https://github.com/1001Josias/blueprint-ai/pull/28)

---
project_id: workspaces
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: Workspaces & Access Control

## Task 1: Core Refactoring
- **id:** task-ws-101
- **status:** done
- **priority:** critical
- **description:** Refactor the codebase to support project nesting.

### Subtasks

#### [x] Update Project Discovery
Modify `getProjectSlugs` (or `getAllProjects`) in `markdown.ts` to scan subdirectories (two levels deep: `workspace/project`).

#### [x] Update API Routes
Update dynamic routes `[slug]` to handle the workspace prefix (e.g., `[workspace]/[project]`).

---

## Task 2: Security Implementation
- **id:** task-ws-102
- **status:** done
- **priority:** high
- **description:** Implement the "Key to the House" logic.

### Subtasks

#### [x] Define Auth Model
Decide how to map tokens to workspaces (Env vars? Database? JSON file?). For MVP: Environment variables like `Key_WorkspaceA=token123`.

#### [x] Middleware Update
Update the API Middleware to extract the token, determine the allowed Workspace, and inject this context into the request.

#### [x] Filter Logic
Ensure `getAllProjects` and specific project actions respect the injected Workspace context.

---

## Task 3: Migration Strategy
- **id:** task-ws-103
- **status:** done
- **priority:** medium
- **description:** Handle existing "flat" projects.

### Subtasks

#### [x] Create Default Workspace
Move existing root projects into a `projects/default` folder.

#### [x] Update Redirects
Ensure old URLs redirect to the new structure if accessed via Browser.

---
project_id: agent-communication
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: External Agent Communication API

## Task 1: Auth and Core API
- **id:** task-agent-101
- **status:** todo
- **priority:** critical
- **description:** Implement the authentication middleware and base API structure.

### Subtasks

#### [ ] Implement Auth Middleware
Create a `validateApiKey` function that checks the `Authorization` header against `process.env.BLUEPRINT_API_KEY`.

#### [ ] Define API Schemas
Create Zod schemas for the external API requests/responses (if different from internal ones).

#### [ ] Create Project Endpoints
Implement `GET /api/external/projects` and `GET /api/external/projects/:slug` to expose read-only context.

---

## Task 2: Task Management Endpoints
- **id:** task-agent-102
- **status:** todo
- **priority:** high
- **description:** Allow agents to create and modify tasks.

### Subtasks

#### [ ] Implement Create Task
Create `POST /api/external/projects/:slug/tasks` handler. Needs to append to `tasks.md`.

#### [ ] Implement Update Task
Create `PATCH /api/external/tasks/:taskId` handler. Needs to update specific task in `tasks.md`.

#### [ ] Validate Inputs
Ensure agents cannot inject malformed Markdown or corrupt the file structure.

---

## Task 3: Documentation and Testing
- **id:** task-agent-103
- **status:** todo
- **priority:** medium
- **description:** Ensure the API is usable by LLMs.

### Subtasks

#### [ ] Generate OpenAPI Spec
Create a `openapi.json` route or static file describing the external API.

#### [ ] Integration Tests
Write a script acting as an "external agent" to verify the full flow (Auth -> List -> Create -> Update).

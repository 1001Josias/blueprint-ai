---
project_id: mcp-server
prd_version: '1.0'
created_at: '2026-01-11'
updated_at: '2026-01-11'
---

# Tasks: MCP Server Integration

## Task 1: Server Initialization
- **id:** mcp-001
- **status:** todo
- **priority:** high
- **description:** Setup the MCP server infrastructure within the monorepo.

### Subtasks

#### [ ] Create Package
Create `apps/mcp-server` (or `packages/mcp-server` if it's a library, but likely an app/service). Use `@modelcontextprotocol/sdk`.

#### [ ] Configure Build
Update `turbo.json` and `package.json` to include the new app in the workspace.

#### [ ] Basic Server
Implement a simple "Hello World" MCP server over Stdio to verify connectivity.

---

## Task 2: Resource Implementation (Read)
- **id:** mcp-002
- **status:** todo
- **priority:** high
- **description:** Expose BlueprintAI projects and tasks as MCP Resources.

### Subtasks

#### [ ] Project List Resource
Implement `blueprint://projects` to return a JSON list of all available projects.

#### [ ] Task List Resource
Implement `blueprint://<project-slug>/tasks` to return the content of `tasks.md`.

#### [ ] PRD Resource
Implement `blueprint://<project-slug>/prd` to return the content of `prd.md`.

---

## Task 3: Tool Implementation (Write)
- **id:** mcp-003
- **status:** todo
- **priority:** high
- **description:** Allow agents to modify tasks via MCP Tools.

### Subtasks

#### [ ] `create_task` Tool
Inputs: `projectId`, `title`, `description`, `priority`.
Logic: Appends a new task to `tasks.md`.

#### [ ] `update_task_status` Tool
Inputs: `projectId`, `taskId`, `status`.
Logic: Finds the task by ID and updates its status field.

#### [ ] `add_comment` Tool
Inputs: `projectId`, `taskId`, `content`.
Logic: Appends a comment to the task.

---

## Task 4: Agentic Prompts
- **id:** mcp-004
- **status:** todo
- **priority:** medium
- **description:** Pre-defined prompts to help agents navigate the system.

### Subtasks

#### [ ] `get_next_important_task`
Prompt logic: "Read all projects, find 'high' priority 'todo' tasks, and return the top 3."

---

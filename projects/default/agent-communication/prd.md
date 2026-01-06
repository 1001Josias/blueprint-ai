---
id: agent-communication
title: External Agent Communication API
status: draft
version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
author: ai-agent
---

# External Agent Communication API

## Objective

Establish a secure and standardized interface to allow external AI agents (from other projects or systems) to interact with the BlueprintAI project management system. The primary goal is to enable these agents to read project context and create or update tasks autonomously.

## Context

Currently, the system is closed to external programmatic access. As the ecosystem grows, agents working in other repositories need a way to report progress or request actions within BlueprintAI without manual human intervention.

## Functional Requirements

### Authentication
1.  **API Key**: Simple Bearer token authentication for external agents.
2.  **Security**: Keys should be managed via environment variables initially. The key is bound to a specific Workspace.

### API Endpoints
1.  **List Projects**: `GET /api/external/workspaces/:workspaceSlug/projects` - To discover available context.
2.  **List Tasks**: `GET /api/external/workspaces/:workspaceSlug/projects/:projectSlug/tasks` - To see what needs to be done.
3.  **Create Task**: `POST /api/external/workspaces/:workspaceSlug/projects/:projectSlug/tasks` - To add new work items.
4.  **Update Task**: `PATCH /api/external/tasks/:taskId` - To report progress (toggle status, add comments/descriptions).

### Data Format
-   **JSON**: All exchanges should be in strict JSON format.
-   **Schema**: Responses should adhere to the existing Zod schemas defined in `@repo/schemas`.

## Non-Functional Requirements

-   **Security**: Prevent unauthorized access to write operations.
-   **Documentation**: Provide an OpenAPI specification (or simple equivalent) so LLMs can easily understand how to use the API.
-   **Error Handling**: Clear error messages (4xx, 5xx) to help agents correct their requests.

## Out of Scope

-   Webhooks (agents receiving push notifications).
-   Complex user management (ACLs per project).
-   Real-time socket communication.

## Success Metrics

1.  An external agent can successfully authenticate and create a task.
2.  The task created by the agent appears correctly in the generic UI.

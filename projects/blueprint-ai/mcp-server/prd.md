---
id: mcp-server
title: MCP Server Integration
status: draft
version: '1.0'
created_at: '2026-01-11'
updated_at: '2026-01-11'
author: ai-agent
---

# MCP Server Integration

## Objective

Transform BlueprintAI into a central task management hub by implementing the Model Context Protocol (MCP). This allows other AI agents (using MCP clients like Claude Desktop, Cursor, etc.) to asynchronously read, create, and update tasks within the system.

## Context

The user envisions BlueprintAI as the "center of tasks" where multiple agents work in parallel on non-conflicting tasks. To achieve this, we need a standard protocol for these agents to interface with the BlueprintAI file system and logic without manual human intervention.

## Functional Requirements

1.  **MCP Server Infrastructure**:
    -   Implement a local MCP server (using `@modelcontextprotocol/sdk`).
    -   Transport: Stdio (standard input/output) for local agent integration.

2.  **Resources (Read Capabilities)**:
    -   Expose `projects` as resources.
    -   Expose `prd.md` and `tasks.md` files as readable resources.
    -   URI Scheme: `blueprint://<project-slug>/tasks`

3.  **Tools (Write/Action Capabilities)**:
    -   `list_projects`: List available projects.
    -   `create_task`: Add a new task to a specific project.
    -   `update_task_status`: Mark tasks as in_progress, done, etc.
    -   `add_task_comment`: Append comments/notes to a task.

4.  **Prompts (Agentic Workflows)**:
    -   `get_next_task`: A prompt that helps an agent pick the next high-priority todo task from a specific project.

## Success Metrics

1.  An external agent (e.g., via Claude Desktop) can connect to BlueprintAI MCP.
2.  The agent can read the list of tasks.
3.  The agent can mark a task as "done" and it updates the local markdown file.

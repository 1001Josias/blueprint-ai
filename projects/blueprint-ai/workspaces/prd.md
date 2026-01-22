---
id: workspaces
title: Workspaces & Access Control
status: draft
version: "1.0"
created_at: "2026-01-06"
updated_at: "2026-01-06"
author: ai-agent
---

# Workspaces & Access Control

## Objective

Implement a higher-level organizational unit called **Workspaces** (serving as the "House" in previous analogies) to group Projects. Crucially, this layer will act as a security boundary: Agents/Users will authenticate against a specific Workspace and only access Projects within it.

## Context

Currently, the system uses a flat `projects/` directory. All agents have visibility over all projects. The goal is to isolate context and access, allowing multiple independent groups (or "Houses") to coexist in the same system without interference.

## Functional Requirements

### Data Structure (Hierarchy)

1.  **Workspaces Directory**: Refactor the file structure to support `projects/<workspace_slug>/<project_slug>`.
2.  **Manifest**: Each workspace may have a `workspace.md` or similar to define its metadata (Name, Owner, allowed Keys).

### Authentication & Authorization

1.  **Scoped Keys**: API Keys currently global must be scoped. An Agent connecting with Key A (Maria) maps to Workspace A (House X).
2.  **Access Enforcement**: The API `GET /projects` must filter results based on the authenticated Workspace.
3.  **Isolation**: An agent in Workspace A cannot read or write tasks in Workspace B.

## Non-Functional Requirements

- **Backward Compatibility**: Existing projects in the root of `projects/` should be treated as a "Default Workspace" or migrated.
- **Scalability**: The filesystem traversal must be efficient (avoid scanning the entire disk).

## Out of Scope

- Fine-grained permissions _within_ a project (e.g., read-only users). The security boundary is the Workspace.

## Success Metrics

1.  Directory structure supports nesting: `projects/house-x/dishes`.
2.  Agent "Maria" can only list/edit projects inside `house-x`.
3.  Agent "Joao" (House Y) receives 403 Forbidden or simply doesn't see House X's projects.

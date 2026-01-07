---
id: enterprise-core
title: Enterprise Core Features
status: draft
version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
author: ai-agent
---

# Enterprise Core Features

## Objective

Prepare the system for large-scale organizational usage with multiple users, robust persistence, and real-time capabilities.

## Context

Current file-based system is single-player. Enterprise ready means Database, Auth, and Real-time. Covers v2.0 Roadmap.

## Functional Requirements

1.  **Persistence**: Migrate from Markdown-only to PostgreSQL (with Markdown sync or full DB).
2.  **Multi-user**: User accounts, login, roles.
3.  **Real-time**: WebSockets for live updates across clients.

## Success Metrics

1.  Multiple users can view/edit the same project simultaneously without conflicts.

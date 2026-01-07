---
id: documentation-site
title: Documentation Site
status: draft
version: '1.1'
created_at: '2026-01-05'
updated_at: '2026-01-05'
author: ai-agent
---

# Documentation Site

## Objective

Create a dedicated documentation site for BlueprintAI, separate from the main application. The goal is to provide a complete and professional guide for users and developers, facilitating project adoption and contribution.

## Context

Currently, documentation is scattered across Markdown files within the repository (`README.md`, `AGENTS.md`). As the project grows, it is necessary to centralize this information in an accessible, searchable, and well-structured portal.

## Functional Requirements

### Documentation Platform
1. **Framework**: Use **Fumadocs** (Next.js App Router).
2. **Content Structure**:
   - **Getting Started**: Installation, local configuration, and "Hello World".
   - **User Guide**: How to create PRDs, Tasks, and use BlueprintAI features.
   - **Agent Reference**: Technical documentation of schemas and standards. **Note:** The `AGENTS.md` file will be kept in the root for LLM consumption; the site will serve as a visualization for humans.
   - **API Reference**: Documentation of internal endpoints (e.g., task updates).

### Site Features
1. **Full-text Search**: Indexing of all content using Fumadocs search.
2. **Dark Mode**: Support for dark theme, aligned with the main app's visual identity.
3. **MDX**: Support for React components and TypeTable for props/schema documentation.
4. **Navigation**: Automatic sidebar based on folder structure (File-system routing).

## Non-Functional Requirements

- **Performance**: The site must load instantly (Next.js SSG/SSR).
- **Design**: Maintain visual consistency with BlueprintAI (violet/dark color palette).
- **Maintainability**: Content written in MDX.
- **Visual Richness**: Prioritize inclusion of screenshots/GIFs whenever describing UI functionalities.

## Out of Scope

- Migration to monorepo (will be handled in a separate infrastructure project).
- Login system or access control (documentation will be public).
- Translation/i18n (initially only in one language, Portuguese or English as per project standard).

## Success Metrics

1. Site published and accessible.
2. All current content from `README.md` and `AGENTS.md` migrated and expanded.
3. Search functionality returning relevant results.

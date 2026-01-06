---
id: monorepo-infra
title: Monorepo Infrastructure
status: draft
version: '1.0'
created_at: '2026-01-05'
updated_at: '2026-01-05'
author: ai-agent
---

# Monorepo Infrastructure

## Objective

Migrate the BlueprintAI project structure to a scalable monorepo using Turborepo, allowing the coexistence of the current Web App and the future Documentation Site, with efficient sharing of code and configurations.

## Context

Migration is a prerequisite for the development of the documentation site. We need to ensure that the developer experience (DX) remains fluid and that there are no regressions in the main app during the transition.

## Functional Requirements

### Monorepo Structure
1. **Turborepo**: Root configuration with `turbo.json` for script orchestration.
2. **Package Manager**: Use `pnpm workspaces` for dependency management.
3. **Workspace Organization**:
   - `apps/web`: The current Next.js Web App (migrated from root).
   - `apps/docs`: The future documentation site (placeholder/initialization).
   - `packages/*`: Shared libraries.

### Shared Packages
1. **`packages/ui`**: Shared base UI components (shadcn/ui).
2. **`packages/schemas`**: Zod schemas (PRD, Tasks) to be used by both the app and documentation.
3. **`packages/utils`**: Utility functions (formatters, parsers).
4. **`packages/config`**: Base configurations for TypeScript, ESLint, and Tailwind.

## Non-Functional Requirements

- **Zero Downtime**: The web app must continue working normally after the migration.
- **Build Performance**: Use Turborepo cache for incremental builds.
- **DX**: Unified scripts in the root (`pnpm dev`, `pnpm build`, `pnpm lint`).

## Out of Scope

- Implementation of documentation site content (will be done in the `documentation-site` project).
- Functional changes in the Web App (structural refactoring only).

## Success Metrics

1. `pnpm install` in the root installs dependencies for all workspaces.
2. `pnpm dev` starts web app and docs simultaneously.
3. Build and Lint pass successfully in all workspaces.

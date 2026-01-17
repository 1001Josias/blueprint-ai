---
project_id: monorepo-infra
prd_version: "1.0"
created_at: "2026-01-05"
updated_at: "2026-01-17"
---

# Tasks: Monorepo Infrastructure

## Task 1: Workspace Setup

- **id:** task-201
- **status:** done
- **priority:** critical
- **description:** Initialize and configure the monorepo root.

### Subtasks

#### [x] Configure pnpm workspaces

Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*`.

#### [x] Initialize Turborepo

Create `turbo.json` with `build`, `dev`, `lint` pipelines.

#### [x] Adjust root package.json

Define global scripts and remove dependencies that will be moved to apps.

---

## Task 2: Configuration Extraction

- **id:** task-202
- **status:** done
- **priority:** high
- **description:** Create shared configuration packages.

### Subtasks

#### [x] Create packages/tsconfig

Package with `tsconfig.base.json` and `tsconfig.next.json`.

#### [x] Create packages/eslint-config

Package with base ESLint/Prettier configuration.

#### [x] Create packages/tailwind-config

Package with Tailwind preset (Transmute colors, fonts).

---

## Task 3: Web App Migration

- **id:** task-203
- **status:** done
- **priority:** critical
- **description:** Move current app code to `apps/web`.

### Subtasks

#### [x] Move files

Move `src/`, `public/`, and config files to `apps/web`.

#### [x] Adjust internal imports

Fix relative paths and aliases (`@/*`).

#### [x] Validate isolated execution

Ensure the app runs correctly within the new location.

---

## Task 4: Shared Code Extraction

- **id:** task-204
- **status:** done
- **priority:** medium
- **description:** Extract business-agnostic logic to packages.

### Subtasks

#### [x] Extract packages/schemas

Move Zod definitions to shared package.

#### [x] Extract packages/utils

Move generic helpers.

#### [x] Refactor Web App to use packages

Replace local imports with `@blueprint/schemas` and `@blueprint/utils` imports.

---

## Task 5: Migrate packages from tsup to unbuild

- **id:** task-205
- **status:** todo
- **priority:** medium
- **description:** Migrate shared packages from deprecated tsup to unbuild for library bundling.
- **comment:** tsup is deprecated and recommends migration to tsdown, but tsdown (beta) has compatibility issues with pnpm + native bindings. unbuild is stable (v3.6.x) and used by Nuxt/unjs ecosystem.

### Subtasks

#### [ ] Migrate packages/schemas

Replace tsup with unbuild:

- Update `package.json`: replace `tsup` with `unbuild` in devDependencies
- Update build script: `"build": "unbuild"`
- Create `build.config.ts` with unbuild configuration
- Update exports in `package.json` for `.mjs`/`.cjs` output
- Verify build output and lint pass

#### [ ] Migrate packages/utils

Replace tsup with unbuild:

- Update `package.json`: replace `tsup` with `unbuild` in devDependencies
- Update build script: `"build": "unbuild"`
- Create `build.config.ts` with unbuild configuration
- Update exports in `package.json` for `.mjs`/`.cjs` output
- Verify build output and lint pass

#### [ ] Verify monorepo build

Run `pnpm build` at root level to ensure all packages build correctly together.

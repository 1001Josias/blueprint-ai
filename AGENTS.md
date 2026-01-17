# AGENTS.md

This file contains concise, actionable rules for autonomous coding agents working in the BlueprintAI repository. It focuses on build/lint/test commands and strict code-style / error-handling conventions so agents can operate consistently.

---

Build / Dev / Lint / Test

- Root workspace install: `pnpm install` (uses `pnpm@9.x`, node >= 18)
- Start local dev (monorepo): `pnpm dev` (runs Turborepo `turbo dev`)
- Build all packages: `pnpm build` (runs `turbo build`)
- Lint everything: `pnpm lint` (runs `turbo lint`)
- Format: `pnpm format` (runs Prettier over `*.{ts,tsx,md}`)

Per-package commands (examples):

- Run web dev server: `pnpm --filter web dev` or `cd apps/web && pnpm dev`
- Lint web package: `pnpm --filter web lint` or `cd apps/web && pnpm run lint`

Testing (current repo):

- There is no global test script in the workspace packages by default. Before running tests, verify which test runner is installed (common choices: Vitest, Jest, Playwright).
- Recommended test setup: add Vitest to packages that need tests (`pnpm add -D -w vitest @vitest/ui`), then add `test` scripts per package.

Common single-test commands (add to package.json `scripts`):

1. Vitest (recommended for Vite/Next + React):
   - Run a single test file: `pnpm --filter <pkg> test -- <path/to/file.test.ts>`
   - Run a single test name: `pnpm --filter <pkg> test -- -t "should do X"`
2. Jest:
   - Run a single file: `pnpm --filter <pkg> test -- <path/to/file.test.ts>` or `jest <path/to/file.test.ts>`
   - Run a single test name: `jest -t "should do X"`

Notes:

- When no top-level `test` script exists, run the test runner directly from the package (e.g., `cd packages/ui && npx vitest`).
- For workspace-scoped runs use `pnpm --filter <package>` to target a package without changing directories.

---

Coding Style & Conventions (for agents)

Language & Tooling

- TypeScript with `strict` mode is mandatory in all packages.
- Prefer functional React components and hooks (no class components).
- Use Prettier for formatting; run `pnpm format` before committing.
- Use ESLint (repo-level `@repo/eslint-config`). Run `pnpm lint` before committing.

File & Naming

- Files: kebab-case (e.g., `task-list.tsx`).
- React component files: PascalCase and match default export (e.g., `TaskCard.tsx` -> `export default function TaskCard(...)`).
- Hooks: `useXxx` camelCase files (`use-task-store.ts` -> `useTaskStore`).
- Types/Interfaces: PascalCase and suffix `Props` for component props (e.g., `TaskCardProps`).
- Constants: UPPER_SNAKE for config-like constants (e.g., `DEFAULT_PAGE_SIZE`), otherwise camelCase.

Imports

- Order: builtin/node -> external packages -> workspace aliases (`@repo/*`) -> app absolute (`@/`) -> relative imports.
- Group imports with a single blank line between these groups.
- Avoid deep relative chains like `../../../../foo` — prefer workspace aliases or move code.
- Prefer named exports; use default export only for React components and single-entry modules.

Types & APIs

- Prefer explicit return types on exported functions. For internal helpers, prefer type inference only when obvious.
- Avoid `any`. If unavoidable, document reason with a `// TODO` and a short justification, and prefer `unknown` with validation.
- Use Zod for runtime validation of external or user input. Parse once at the boundary (API handler), then pass validated types internally.
- Use `readonly` for arrays/objects where mutation isn't intended.
- Use discriminated unions for variants (e.g., `type Result = {status: 'ok', data: T} | {status: 'err', error: E}`)

React / Next.js

- Mark client components with `'use client'` only at the top level when needed.
- Keep server components purely server-side; only opt into client when DOM or state is required.
- Component props should be small and explicit; prefer composition over large prop objects.
- Keep hooks pure and side-effect free (effects only inside `useEffect`/`useLayoutEffect`).

State & Side Effects

- URL state: use query params for shareable state (use `useQueryState` helpers).
- App state: use Zustand stores for global UI state and optimistic caches.
- Never duplicate URL state in global stores unless necessary; document the reason.

Error Handling

- Do not swallow errors silently. Always handle errors at the boundary and log context.
- Server-side: throw rich errors with informative messages and optional `.cause` (or use a central `createError` helper).
- API handlers: validate with Zod and return structured error responses (status + code + message).
- On the client: present friendly messages and fallback UI; capture technical details in logs (Sentry/logging).
- Use try/catch sparingly around operations that may fail; re-throw if you can't handle.

Logging & Secrets

- Use structured logs (JSON) for server-side processes where possible.
- Never log secrets (env vars, tokens). If a secret leak is suspected, mark task as `blocked` and notify the user.

Performance & Accessibility

- Use lazy-loading for large components and `React.Suspense` for graceful loading.
- Follow basic a11y rules: semantic HTML, labels for inputs, keyboard navigation, color contrast.

Testing Guidance

- Aim for unit tests on business logic (Zod schemas, util functions) and integration tests for critical flows.
- Prefer Vitest for unit tests; add Playwright or Cypress for E2E where needed.
- Keep tests deterministic and fast; avoid network calls by mocking fetch/clients.

Docs & Project Files

- Update `apps/docs` when modifying public APIs, schemas, or major UX flows.
- When creating projects content (`projects/<slug>/prd.md` and `tasks.md`), follow the repo frontmatter patterns.

Git / PR Conventions (brief)

- Branches: `feat/<desc>`, `fix/<desc>`, `docs/<topic>`.
- Commits: conventional commit prefixes (`feat:`, `fix:`, `docs:`).
- Run `pnpm lint` and `pnpm build` before committing. Create PRs for all changes (don't push direct to `main`).

Agent Workflow Rules (short)

- Work on only one task per session and set its status to `in_progress` in `tasks.md`.
- Before starting, `git checkout main && git pull`, then create a branch from main.
- Verify code doesn't already implement the task. If implemented, mark task `done` and document findings.
- If a task is blocked, set `status: blocked` with `- **comment:**` explaining the blocker.

Where To Add Cursor / Copilot Rules

- No `.cursor` or `.cursorrules` directories found — no additions required.
- No `.github/copilot-instructions.md` found.

If you want me to also:

1. Add a recommended `vitest` setup + `test` script to `packages/*` (I can create the files), or
2. Add a `scripts.test` example to `apps/web/package.json` — reply with `1` or `2`.

---

Guideline change log: agents should append a one-line note when they substantially change this file with date and short rationale.

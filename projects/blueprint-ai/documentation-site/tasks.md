---
project_id: documentation-site
prd_version: '1.1'
created_at: '2026-01-05'
updated_at: '2026-01-06'
---

# Tasks: Documentation Site

## Task 1: Docs Project Setup
- **id:** task-101
- **status:** done
- **priority:** high
- **description:** Initialize documentation project using Fumadocs (Next.js App Router).

### Subtasks

#### [x] Initialize Fumadocs project
Create initial project structure using Fumadocs CLI (`create-fumadocs-app`).

#### [x] Configure project metadata
Update `source.config.ts` or similar to define title, description, and file structure.

#### [x] Configure theme (Tailwind CSS)
Adjust Tailwind colors to use BlueprintAI's violet/dark theme.

---

## Task 2: Content Migration and Creation
- **id:** task-102
- **status:** todo
- **priority:** high
- **description:** Migrate existing content and create new documentation pages.

### Subtasks

#### [x] Migrate Getting Started
Create `content/docs/index.mdx` page with introduction and setup (based on README).

#### [x] Create "Core Concepts" Guide
Document PRD -> Tasks flow and `projects/` directory structure.

#### [x] Create Schema Reference
Document Zod schemas and frontmatter (based on `AGENTS.md`) using TypeTable if possible.

#### [x] Create API Guide
Document endpoints like `PATCH /api/tasks/[taskId]` using OpenAPI or manual MDX.

---

## Task 3: Integration and Deploy
- **id:** task-103
- **status:** todo
- **priority:** medium
- **description:** Final adjustments and deployment preparation.

### Subtasks

#### [x] Configure Search
Verify indexing and functionality of Fumadocs search.

#### [ ] SEO Review
Add appropriate meta tags and descriptions.

#### [ ] Validate cross-links
Ensure all internal links work correctly.

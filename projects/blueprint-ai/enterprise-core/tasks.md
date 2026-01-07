---
project_id: enterprise-core
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: Enterprise Core Features

## Task 1: Database Migration
- **id:** task-ent-101
- **status:** todo
- **priority:** critical
- **description:** Setup PostgreSQL and Prisma/Drizzle.

### Subtasks

#### [ ] Schema Design
Define User, Workspace, Project, Task tables.

#### [ ] Sync Engine
Logic to keep Markdown files (Git) in sync with DB (if hybrid) or full migration.

---

## Task 2: Authentication
- **id:** task-ent-102
- **status:** todo
- **priority:** high
- **description:** Multi-user support.

### Subtasks

#### [ ] Auth Implementation
Integrate NextAuth (Auth.js) or Clerk/Supabase.

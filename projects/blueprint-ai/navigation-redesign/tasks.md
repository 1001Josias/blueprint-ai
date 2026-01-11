---
project_id: navigation-redesign
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: Navigation & Views Redesign

## Task 1: Advanced Sidebar Navigation
- **id:** nav-101
- **status:** done
- **priority:** high
- **description:** Enhance Sidebar with nested menus and filtering capabilities.

### Subtasks

#### [x] Implement Nested Menu Structure
Implemented groupBy toggle (workspace/workflow) and collapsible category grouping within workspaces.

#### [x] Add Status Filters
Allow filtering projects list by status (e.g., Active, Archived) directly in the sidebar.

#### [x] Workflow Grouping
Implemented workflow grouping mode with toggle UI in sidebar.

---

## Task 2: New Dashboard Views
- **id:** nav-102
- **status:** done
- **priority:** medium
- **description:** Implement new high-level views for task aggregation.

### Subtasks

#### [x] "Today" View
Aggregate tasks due today or marked for today across all/filtered projects.

#### [x] "Upcoming" View
List tasks scheduled for the near future.

#### [x] "Calendar" View
Visual calendar representation of project milestones and task due dates.

#### [x] "Reports" View
High-level stats and reporting dashboard (as seen in the design concept).

---

## Task 3: Improved Sidebar Filters
- **id:** nav-103
- **status:** todo
- **priority:** high
- **description:** Replace generic "Active/Archived" filters with more meaningful workflow-based filters (Planning, In Progress, Completed).

### Subtasks

#### [ ] Implementation Plan
Create implementation plan for new filter logic.

#### [ ] Implement Smart Filters
- **Planning**: Projects in `draft` or `in_review`.
- **In Progress**: Projects `approved` with incomplete tasks.
- **Completed**: Projects `approved` with 100% tasks completed.
- **Archived**: Projects `rejected`.

#### [ ] Update Sidebar UI
Replace existing filter buttons with new set.


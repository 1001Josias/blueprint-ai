---
project_id: integrations
prd_version: '1.0'
created_at: '2026-01-06'
updated_at: '2026-01-06'
---

# Tasks: Third-Party Integrations

## Task 1: GitHub Integration
- **id:** task-int-101
- **status:** todo
- **priority:** medium
- **description:** Export to GitHub Issues.

### Subtasks

#### [ ] Research GitHub API
Verify scopes needed for issue creation.

#### [ ] OAuth Flow / Token Input
Allow user to input PAT or authenticate via OAuth.

#### [ ] Sync Logic
Map Task -> Issue, Subtask -> Checklist (or separate issues).

---

## Task 2: Linear Integration
- **id:** task-int-102
- **status:** todo
- **priority:** medium
- **description:** Export to Linear.

### Subtasks

#### [ ] Research Linear API
Understanding GraphQL API and Project/Issue mapping.

#### [ ] Export Implementation
Create Linear Project and Issues from Markdown data.

---

## Task 3: Jira Integration
- **id:** task-int-103
- **status:** todo
- **priority:** medium
- **description:** Export to Jira.

### Subtasks

#### [ ] Research Jira API
Verify Cloud API specifics (Atlassian Connect or OAuth 2.0).

#### [ ] Map Fields
Map BlueprintAI Priority/Status to Jira fields.

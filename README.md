<p align="center">
  <img src="docs/assets/logo.svg" alt="BlueprintAI Logo" width="80" height="80">
</p>

<h1 align="center">BlueprintAI</h1>

<p align="center">
  <strong>AI-powered PRD & task management system</strong>
</p>

<p align="center">
  Transform AI-generated PRDs into beautiful, trackable tasks
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#for-ai-agents">For AI Agents</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## ✨ Features

- 🤖 **AI-First Design** - Structured markdown format optimized for AI agents to generate PRDs and tasks
- 📋 **PRD Management** - Beautiful rendering of Product Requirements Documents with status tracking
- ✅ **Task Tracking** - Hierarchical tasks with subtasks, priorities, and status filters
- 🎨 **Premium UI** - Dark theme with glassmorphism effects, smooth animations, and responsive design
- 📊 **Dashboard** - Overview of all projects with progress stats and metrics
- 🔄 **Real-time Updates** - Hot reload when markdown files change during development

## 📸 Screenshots

<p align="center">
  <img src="docs/assets/dashboard.png" alt="Dashboard" width="800">
  <br>
  <em>Dashboard with project overview and stats</em>
</p>

<p align="center">
  <img src="docs/assets/project-detail.png" alt="Project Detail" width="800">
  <br>
  <em>Project detail with PRD and expandable tasks</em>
</p>

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/1001Josias/blueprint-ai.git
cd blueprint-ai

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Creating Your First Project

1. Create a new directory in `projects/`:
   ```bash
   mkdir -p projects/my-project
   ```

2. Create `prd.md` with your PRD:
   ```markdown
   ---
   id: "my-project"
   title: "My Awesome Project"
   status: "draft"
   version: "1.0"
   created_at: "2026-01-05"
   updated_at: "2026-01-05"
   author: "ai-agent"
   ---

   # My Awesome Project

   ## Objetivo
   Description of what this project aims to achieve...
   ```

3. Create `tasks.md` with your tasks:
   ```markdown
   ---
   project_id: "my-project"
   prd_version: "1.0"
   created_at: "2026-01-05"
   updated_at: "2026-01-05"
   ---

   # Tasks: My Awesome Project

   ## Task 1: First Task
   - **id:** task-001
   - **status:** todo
   - **priority:** high
   - **description:** Description of the task.

   ### Subtasks

   #### [ ] First subtask
   Description of what needs to be done.
   ```

4. Refresh the browser to see your project!

## 🤖 For AI Agents

BlueprintAI is designed to work seamlessly with AI coding assistants. See [AGENTS.md](AGENTS.md) for:

- Setup commands and code style
- PRD and Tasks markdown schemas
- Git conventions and PR instructions

### Quick Reference

| Field | PRD Values | Task Values |
|-------|------------|-------------|
| **Status** | `draft`, `in_review`, `approved`, `rejected` | `todo`, `in_progress`, `done`, `blocked` |
| **Priority** | - | `low`, `medium`, `high`, `critical` |

## 📁 Project Structure

```
blueprint-ai/
├── apps/
│   ├── web/                   # Next.js App Router (Main App)
│   └── docs/                  # Fumadocs Documentation Site
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── schemas/               # Shared Zod schemas
│   ├── utils/                 # Shared utilities
│   ├── tsconfig/              # Shared TypeScript configs
│   └── eslint-config/         # Shared ESLint configs
├── content/
│   └── projects/              # User projects (PRDs & Tasks)
└── AGENTS.md                  # Instructions for AI agents
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Markdown** | [gray-matter](https://github.com/jonschlinkert/gray-matter) + [remark](https://github.com/remarkjs/remark) |
| **Validation** | [Zod](https://zod.dev/) |
| **Package Manager** | [pnpm](https://pnpm.io/) |

## 🗺️ Roadmap

### v1.0 (Current) - MVP ✅
- [x] Dashboard with project overview
- [x] PRD rendering with metadata
- [x] Task list with status filters
- [x] Expandable subtasks with descriptions
- [x] Dark theme with premium UI

### v1.1 - Edit via UI
- [ ] Toggle task status with click
- [ ] Edit task metadata (modal)
- [ ] Create/delete tasks
- [ ] Create new projects
- [ ] i18n support (English/Portuguese)

### v1.2 - Integrations
- [ ] Export to GitHub Issues
- [ ] Export to Jira
- [ ] Export to Linear
- [ ] Bulk export

### v2.0 - Enterprise Features
- [ ] Multi-user support
- [ ] Database backend (PostgreSQL)
- [ ] Real-time collaboration
- [ ] API for automations

## � Future Features

A comprehensive list of planned features for future releases:

### UI/UX Enhancements
| Feature | Description |
|---------|-------------|
| **PRD Enhanced Viewer** | Better PRD rendering with collapsible sections, table of contents, and syntax highlighting |
| **PRD Editor** | Edit PRD content directly in the UI with live preview |
| **Kanban View** | Drag-and-drop board view for tasks |
| **Timeline/Gantt** | Visual timeline for project planning |
| **Search & Filters** | Global search across all projects and tasks |
| **Keyboard Shortcuts** | Power-user shortcuts for common actions |
| **Customizable Themes** | Light mode and custom color schemes |
| **Mobile Responsive** | Full mobile experience with touch gestures |

### AI & Automation
| Feature | Description |
|---------|-------------|
| **AI Task Suggestions** | Automatically suggest subtasks based on PRD |
| **Smart Estimates** | AI-powered time estimation for tasks |
| **Progress Insights** | AI analysis of project health and blockers |
| **Auto-prioritization** | Intelligent task priority suggestions |

### Collaboration
| Feature | Description |
|---------|-------------|
| **Comments & Discussions** | Thread-based discussions on tasks |
| **Mentions & Notifications** | @mention team members with alerts |
| **Activity Feed** | Real-time feed of project changes |
| **Role-based Access** | Admin, editor, and viewer roles |

### Integrations
| Feature | Description |
|---------|-------------|
| **GitHub Issues** | Two-way sync with GitHub Issues |
| **Jira** | Export and sync with Jira projects |
| **Linear** | Integration with Linear issues |
| **Slack** | Notifications and commands in Slack |
| **VS Code Extension** | Create/view tasks directly in IDE |
| **Webhooks** | Custom webhooks for automation |

### Data & Analytics
| Feature | Description |
|---------|-------------|
| **Dashboard Analytics** | Charts and metrics for productivity |
| **Export Formats** | PDF, CSV, and JSON exports |
| **Backup & Restore** | Automated backups with restore points |
| **Audit Log** | Complete history of all changes |
---

<p align="center">
  Made with 💜 by Josias Junior
</p>


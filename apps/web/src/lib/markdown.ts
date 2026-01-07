import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import {
  prdFrontmatterSchema,
  tasksFrontmatterSchema,
  type Project,
  type ProjectSummary,
  type Task,
  type Subtask,
} from "./schemas";

const projectsDirectory = path.join(process.cwd(), "..", "..", "projects");

export interface ProjectPath {
  workspace: string;
  slug: string;
}

/**
 * Get all project paths (workspace/project)
 */
export function getAllProjectPaths(workspaceFilter?: string): ProjectPath[] {
  if (!fs.existsSync(projectsDirectory)) {
    return [];
  }

  const paths: ProjectPath[] = [];
  const workspaces = fs.readdirSync(projectsDirectory).filter((name) => {
    if (name.startsWith(".")) return false;
    // If a filter is active, only include that workspace
    if (workspaceFilter && name !== workspaceFilter) return false;
    
    const wsPath = path.join(projectsDirectory, name);
    return fs.statSync(wsPath).isDirectory();
  });

  for (const ws of workspaces) {
    const wsPath = path.join(projectsDirectory, ws);
    const projects = fs.readdirSync(wsPath).filter((name) => {
      if (name.startsWith(".")) return false;
      const projPath = path.join(wsPath, name);
      return fs.statSync(projPath).isDirectory();
    });

    for (const proj of projects) {
      paths.push({ workspace: ws, slug: proj });
    }
  }

  return paths;
}

/**
 * Parse markdown content to HTML
 */
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

/**
 * Parse tasks from markdown content
 */
function parseTasks(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split("\n");

  let currentTask: Partial<Task> | null = null;
  let currentSubtasks: Subtask[] = [];
  let isInSubtasks = false;
  let subtaskTitle = "";
  let subtaskDescription = "";
  let subtaskCompleted = false;
  let subtaskComments: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Task header (## Task N: Title)
    const taskMatch = line.match(/^## Task \d+:\s*(.+)$/);
    if (taskMatch) {
      // Save previous task
      if (currentTask && currentTask.id) {
        currentTask.subtasks = currentSubtasks;
        tasks.push(currentTask as Task);
      }

      currentTask = {
        id: "",
        title: taskMatch[1].trim(),
        status: "todo",
        priority: "medium",
        description: "",
        subtasks: [],
        comments: [],
      };
      currentSubtasks = [];
      isInSubtasks = false;
      continue;
    }

    // Task metadata
    if (currentTask) {
      const idMatch = line.match(/^- \*\*id:\*\*\s*(.+)$/);
      if (idMatch) {
        currentTask.id = idMatch[1].trim();
        continue;
      }

      const statusMatch = line.match(/^- \*\*status:\*\*\s*(.+)$/);
      if (statusMatch) {
        const status = statusMatch[1].trim().toLowerCase();
        if (["todo", "in_progress", "done", "blocked"].includes(status)) {
          currentTask.status = status as Task["status"];
        }
        continue;
      }

      const priorityMatch = line.match(/^- \*\*priority:\*\*\s*(.+)$/);
      if (priorityMatch) {
        const priority = priorityMatch[1].trim().toLowerCase();
        if (["low", "medium", "high", "critical"].includes(priority)) {
          currentTask.priority = priority as Task["priority"];
        }
        continue;
      }

      const descMatch = line.match(/^- \*\*description:\*\*\s*(.+)$/);
      if (descMatch) {
        currentTask.description = descMatch[1].trim();
        continue;
      }

      // Subtasks header
      if (line.match(/^### Subtasks/)) {
        isInSubtasks = true;
        continue;
      }

      // Comments for Task
      const commentMatch = line.match(/^- \*\*comment:\*\*\s*(.+)$/);
      if (commentMatch && !isInSubtasks) {
        if (!currentTask.comments) currentTask.comments = [];
        currentTask.comments.push(commentMatch[1].trim());
        continue;
      }

      // Subtask title (#### [x] or #### [ ])
      if (isInSubtasks) {
        const subtaskTitleMatch = line.match(/^#### \[(x| )\]\s*(.+)$/);
        if (subtaskTitleMatch) {
          // Save previous subtask
          if (subtaskTitle) {
            currentSubtasks.push({
              title: subtaskTitle,
              description: subtaskDescription.trim() || undefined,
              completed: subtaskCompleted,
              comments: subtaskComments,
            });
          }

          subtaskCompleted = subtaskTitleMatch[1] === "x";
          subtaskTitle = subtaskTitleMatch[2].trim();
          subtaskDescription = "";
          subtaskComments = [];
          continue;
        }

        // Comments for Subtask
        const subtaskCommentMatch = line.match(/^- \*\*comment:\*\*\s*(.+)$/);
        if (subtaskCommentMatch && subtaskTitle) {
          subtaskComments.push(subtaskCommentMatch[1].trim());
          continue;
        }

        // Subtask description (any text after the title)
        if (subtaskTitle && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
          subtaskDescription += line.trim() + " ";
        }
      }
    }
  }

  // Save last subtask
  if (subtaskTitle) {
    currentSubtasks.push({
      title: subtaskTitle,
      description: subtaskDescription.trim() || undefined,
      completed: subtaskCompleted,
      comments: subtaskComments,
    });
  }

  // Save last task
  if (currentTask && currentTask.id) {
    currentTask.subtasks = currentSubtasks;
    tasks.push(currentTask as Task);
  }

  return tasks;
}

/**
 * Get a project by workspace and slug
 */
export async function getProject(workspace: string, slug: string): Promise<Project | null> {
  const projectPath = path.join(projectsDirectory, workspace, slug);

  if (!fs.existsSync(projectPath)) {
    return null;
  }

  const prdPath = path.join(projectPath, "prd.md");
  const tasksPath = path.join(projectPath, "tasks.md");

  if (!fs.existsSync(prdPath) || !fs.existsSync(tasksPath)) {
    return null;
  }

  // Parse PRD
  const prdContent = fs.readFileSync(prdPath, "utf8");
  const prdMatter = matter(prdContent);
  const prdFrontmatter = prdFrontmatterSchema.parse(prdMatter.data);
  const prdHtml = await markdownToHtml(prdMatter.content);

  // Parse Tasks
  const tasksContent = fs.readFileSync(tasksPath, "utf8");
  const tasksMatter = matter(tasksContent);
  const tasksFrontmatter = tasksFrontmatterSchema.parse(tasksMatter.data);
  const tasks = parseTasks(tasksMatter.content);

  return {
    slug,
    workspace,
    prd: {
      frontmatter: prdFrontmatter,
      content: prdMatter.content,
      htmlContent: prdHtml,
    },
    tasks: {
      frontmatter: tasksFrontmatter,
      items: tasks,
    },
  };
}

/**
 * Get all projects with summary info
 */
export async function getAllProjects(workspaceFilter?: string): Promise<ProjectSummary[]> {
  const paths = getAllProjectPaths(workspaceFilter);
  const projects: ProjectSummary[] = [];

  for (const { workspace, slug } of paths) {
    const project = await getProject(workspace, slug);
    if (project) {
      const taskStats = {
        total: project.tasks.items.length,
        done: project.tasks.items.filter((t) => t.status === "done").length,
        inProgress: project.tasks.items.filter((t) => t.status === "in_progress").length,
        todo: project.tasks.items.filter((t) => t.status === "todo").length,
        blocked: project.tasks.items.filter((t) => t.status === "blocked").length,
      };

      projects.push({
        slug,
        workspace,
        title: project.prd.frontmatter.title,
        status: project.prd.frontmatter.status,
        category: project.prd.frontmatter.category,
        workflow: project.prd.frontmatter.workflow,
        taskStats,
      });
    }
  }

  return projects;
}

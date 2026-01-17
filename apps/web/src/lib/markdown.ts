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
        dependencies: [],
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

      const dueDateMatch = line.match(/^- \*\*due_date:\*\*\s*(.+)$/);
      if (dueDateMatch) {
        currentTask.dueDate = dueDateMatch[1].trim();
        continue;
      }

      const dependenciesMatch = line.match(/^- \*\*dependencies:\*\*\s*(.+)$/);
      if (dependenciesMatch) {
        currentTask.dependencies = dependenciesMatch[1]
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0);
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
        currentTask.comments.push(commentMatch[1].trim().replace(/\\n/g, "\n"));
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
          subtaskComments.push(subtaskCommentMatch[1].trim().replace(/\\n/g, "\n"));
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

/**
 * Task with project context for dashboard views
 */
export interface TaskWithProject extends Task {
  workspace: string;
  projectSlug: string;
  projectTitle: string;
}

/**
 * Get all tasks across all projects with project context
 */
/**
 * Get all tasks across all projects with project context
 */
export async function getAllTasksWithProject(workspaceFilter?: string): Promise<TaskWithProject[]> {
  const paths = getAllProjectPaths(workspaceFilter);
  const allTasks: TaskWithProject[] = [];

  for (const { workspace, slug } of paths) {
    const project = await getProject(workspace, slug);
    if (project) {
      for (const task of project.tasks.items) {
        allTasks.push({
          ...task,
          workspace,
          projectSlug: slug,
          projectTitle: project.prd.frontmatter.title,
        });
      }
    }
  }

  return allTasks;
}

/**
 * Convert a Task object back to markdown string
 */
function stringifyTask(task: Task, index: number): string {
  let md = `## Task ${index + 1}: ${task.title}\n`;
  md += `- **id:** ${task.id}\n`;
  md += `- **status:** ${task.status}\n`;
  md += `- **priority:** ${task.priority}\n`;
  if (task.description) md += `- **description:** ${task.description}\n`;
  if (task.dueDate) md += `- **due_date:** ${task.dueDate}\n`;
  if (task.dependencies && task.dependencies.length > 0) {
    md += `- **dependencies:** ${task.dependencies.join(", ")}\n`;
  }
  
  // Task comments
  if (task.comments && task.comments.length > 0) {
    task.comments.forEach(comment => {
      md += `- **comment:** ${comment}\n`;
    });
  }

  // Subtasks
  if (task.subtasks && task.subtasks.length > 0) {
    md += `\n### Subtasks\n\n`;
    task.subtasks.forEach(subtask => {
      const check = subtask.completed ? "x" : " ";
      md += `#### [${check}] ${subtask.title}\n`;
      if (subtask.description) md += `${subtask.description}\n`;
      
      if (subtask.comments && subtask.comments.length > 0) {
        subtask.comments.forEach(comment => {
          md += `- **comment:** ${comment}\n`;
        });
      }
      md += "\n";
    });
  } else {
    md += "\n";
  }

  return md;
}

/**
 * Convert an array of tasks to markdown string
 */
function stringifyTasks(tasks: Task[]): string {
  return tasks.map((task, index) => stringifyTask(task, index)).join("\n");
}

/**
 * Update project tasks order
 */
export async function updateProjectTasksOrder(
  workspace: string, 
  slug: string, 
  orderedTaskIds: string[]
): Promise<void> {
  const projectPath = path.join(projectsDirectory, workspace, slug);
  const tasksPath = path.join(projectPath, "tasks.md");

  if (!fs.existsSync(tasksPath)) {
    throw new Error("Tasks file not found");
  }

  // Read current file
  const content = fs.readFileSync(tasksPath, "utf8");
  const matterResult = matter(content);
  const currentFrontmatter = matterResult.data;
  
  // Parse all existing tasks to get their current data (subtasks, comments, etc)
  const allTasks = parseTasks(matterResult.content);

  // Create a map for quick lookup
  const taskMap = new Map(allTasks.map(t => [t.id, t]));

  // Reconstruct the task list based on the new order
  const newTasks: Task[] = [];
  
  // First, add tasks in the order specified
  for (const id of orderedTaskIds) {
    const task = taskMap.get(id);
    if (task) {
      newTasks.push(task);
      taskMap.delete(id); // Remove so we know what's left
    }
  }

  // Then add any remaining tasks that weren't in the ordered list (safety fallback)
  for (const task of Array.from(taskMap.values())) {
    newTasks.push(task);
  }

  // Generate new markdown content headers + tasks
  // We need to preserve the "header" part of the content (e.g. "# Tasks: ...") 
  // which comes before the first task.
  
  // A simple strategy is to take everything before the first "## Task"
  const firstTaskMatch = matterResult.content.match(/^## Task/m);
  let preamble = "";
  
  if (firstTaskMatch && firstTaskMatch.index !== undefined) {
    preamble = matterResult.content.substring(0, firstTaskMatch.index);
  } else {
    // If no tasks existed, or couldn't find header, assume standard header
    preamble = `\n# Tasks: ${slug}\n\n`;
  }

  const newTasksMarkdown = stringifyTasks(newTasks);
  const newFullMarkdown = preamble + newTasksMarkdown;

  // Update frontmatter
  currentFrontmatter.updated_at = new Date().toISOString().split('T')[0];

  const newFileContent = matter.stringify(newFullMarkdown, currentFrontmatter);
  fs.writeFileSync(tasksPath, newFileContent, "utf8");
}

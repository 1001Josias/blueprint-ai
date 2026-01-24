/**
 * Minimal Task Parser
 *
 * Provides functionality to read and parse tasks.md files for the CLI agents.
 * This is a simplified version of apps/web/src/lib/markdown.ts suited for Node context.
 */

import fs from "fs/promises";
import path from "path";

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
}

/**
 * Parse a tasks.md file content into Task objects
 */
export function parseTasks(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split("\n");

  let currentTask: Partial<Task> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Task header (## Task N: Title)
    // Supports "## Task 1: Title" or "## Task: Title"
    const taskMatch = line.match(/^##\s+Task(?:\s+\d+)?:?\s*(.+)$/);
    if (taskMatch) {
      if (currentTask && currentTask.id) {
        tasks.push(currentTask as Task);
      }

      currentTask = {
        title: taskMatch[1].trim(),
        status: "todo",
        priority: "medium",
        description: "",
      };
      
      continue;
    }

    if (currentTask) {
      // Parse ID
      const idMatch = line.match(/^- \*\*id:\*\*\s*(.+)$/);
      if (idMatch) {
        currentTask.id = idMatch[1].trim();
        continue;
      }

      // Parse Status
      const statusMatch = line.match(/^- \*\*status:\*\*\s*(.+)$/);
      if (statusMatch) {
        const s = statusMatch[1].trim().toLowerCase();
        if (["todo", "in_progress", "done", "blocked"].includes(s)) {
          currentTask.status = s as Task["status"];
        }
        continue;
      }

       // Parse Priority
       const priorityMatch = line.match(/^- \*\*priority:\*\*\s*(.+)$/);
       if (priorityMatch) {
         const p = priorityMatch[1].trim().toLowerCase();
         if (["low", "medium", "high", "critical"].includes(p)) {
           currentTask.priority = p as Task["priority"];
         }
         continue;
       }

       // Parse Description
       const descMatch = line.match(/^- \*\*description:\*\*\s*(.+)$/);
       if (descMatch) {
         currentTask.description = descMatch[1].trim();
         continue;
       }
    }
  }

  // Push last task
  if (currentTask && currentTask.id) {
    tasks.push(currentTask as Task);
  }

  return tasks;
}

/**
 * Get tasks from a project directory
 */
export async function getProjectTasks(projectPath: string): Promise<Task[]> {
  const tasksPath = path.join(projectPath, "tasks.md");
  
  try {
    const content = await fs.readFile(tasksPath, "utf-8");
    return parseTasks(content);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'ENOENT') {
       throw new Error(`tasks.md not found in ${projectPath}`);
    }
    throw error;
  }
}

/**
 * Find project paths in the default directory structure
 * Looks for projects/<workspace>/<project>/tasks.md
 */
export async function findProjectPaths(rootDir: string): Promise<string[]> {
    const projectsRoot = path.join(rootDir, "projects");
    const paths: string[] = [];

    try {
        const workspaces = await fs.readdir(projectsRoot, { withFileTypes: true });
        
        for (const ws of workspaces) {
            if (!ws.isDirectory() || ws.name.startsWith(".")) continue;
            
            const wsPath = path.join(projectsRoot, ws.name);
            const projects = await fs.readdir(wsPath, { withFileTypes: true });
            
            for (const proj of projects) {
                 if (!proj.isDirectory() || proj.name.startsWith(".")) continue;
                 
                 const projPath = path.join(wsPath, proj.name);
                 // Check if tasks.md exists simple check
                 try {
                    await fs.access(path.join(projPath, "tasks.md"));
                    paths.push(projPath);
                 } catch {
                    // Ignore
                 }
            }
        }
    } catch {
        // projects dir might not exist
        return [];
    }
    
    return paths;
}

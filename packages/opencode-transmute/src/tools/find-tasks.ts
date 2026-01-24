import { z } from "zod";
import { getProjectTasks, findProjectPaths } from "../core/tasks";
import { getGitRoot } from "../core/exec";

export const findTasksInputSchema = z.object({
  projectPath: z.string().optional().describe("Path to the project (optional)"),
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional().describe("Filter by status"),
  taskId: z.string().optional().describe("Search for specific task ID"),
});

export type FindTasksInput = z.infer<typeof findTasksInputSchema>;

export const findTasksOutputSchema = z.object({
  projectPath: z.string(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    priority: z.string(),
    description: z.string().optional(),
  })),
});

export type FindTasksOutput = z.infer<typeof findTasksOutputSchema>;

/**
 * Find Tasks Tool
 * 
 * Locates the project and lists tasks.
 */
export async function findTasks(input: FindTasksInput): Promise<FindTasksOutput> {
    const validated = findTasksInputSchema.parse(input);
    const repoRoot = await getGitRoot();

    // 1. Resolve Project Path
    let projectPath = validated.projectPath;
    if (!projectPath) {
      const paths = await findProjectPaths(repoRoot);
      if (paths.length === 0) {
        throw new Error("No projects found in 'projects/' directory.");
      }
      
      if (paths.length > 1) {
          // If taskId is provided, try to find the project containing it
          if (validated.taskId) {
            for (const p of paths) {
                const tasks = await getProjectTasks(p);
                if (tasks.find(t => t.id === validated.taskId)) {
                    projectPath = p;
                    break;
                }
            }
          }
          
          if (!projectPath) {
             // Default to first project if still ambiguous
             // In a real tool, we might want to ask the user or return list of projects
             // For now, we return the first one but warn/indicate
             projectPath = paths[0];
          }
      } else {
        projectPath = paths[0];
      }
    }

    // 2. Load Tasks
    let tasks = await getProjectTasks(projectPath!);

    // 3. Filter
    if (validated.taskId) {
        tasks = tasks.filter(t => t.id === validated.taskId);
    }
    
    if (validated.status) {
        tasks = tasks.filter(t => t.status === validated.status);
    }

    return {
        projectPath: projectPath!,
        tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            description: t.description,
        })),
    };
}

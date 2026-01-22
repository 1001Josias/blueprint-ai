import { z } from "zod";

// PRD Schema
export const prdStatusSchema = z.enum([
  "draft",
  "in_review",
  "approved",
  "rejected",
]);

export const prdFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: prdStatusSchema,
  version: z.string().default("1.0"),
  created_at: z.string(),
  updated_at: z.string(),
  author: z.string().optional(),
  category: z.string().optional(), // For grouping within workspace
  workflow: z.string().optional(), // For cross-workspace grouping
});

export type PRDFrontmatter = z.infer<typeof prdFrontmatterSchema>;
export type PRDStatus = z.infer<typeof prdStatusSchema>;

// Task Schema
export const taskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "blocked",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const subtaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  comments: z.array(z.string()).default([]),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  description: z.string(),
  dueDate: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  subtasks: z.array(subtaskSchema).default([]),
  comments: z.array(z.string()).default([]),
});

export const tasksFrontmatterSchema = z.object({
  project_id: z.string(),
  prd_version: z.string().default("1.0"),
  created_at: z.string(),
  updated_at: z.string(),
});

export type TasksFrontmatter = z.infer<typeof tasksFrontmatterSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Project (combined PRD + Tasks)
export interface Project {
  slug: string;
  workspace: string;
  prd: {
    frontmatter: PRDFrontmatter;
    content: string;
    htmlContent: string;
  };
  tasks: {
    frontmatter: TasksFrontmatter;
    items: Task[];
  };
}

export interface ProjectSummary {
  slug: string;
  workspace: string;
  title: string;
  status: PRDStatus;
  category?: string;
  workflow?: string;
  taskStats: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    blocked: number;
  };
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "projects");

interface UpdateTaskStatusRequest {
  projectSlug: string;
  status: "todo" | "in_progress" | "done" | "blocked";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body: UpdateTaskStatusRequest = await request.json();
    const { projectSlug, status } = body;

    if (!projectSlug || !status || !taskId) {
      return NextResponse.json(
        { error: "Missing required fields: projectSlug, status, taskId" },
        { status: 400 }
      );
    }

    const validStatuses = ["todo", "in_progress", "done", "blocked"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const tasksPath = path.join(projectsDirectory, projectSlug, "tasks.md");

    if (!fs.existsSync(tasksPath)) {
      return NextResponse.json(
        { error: "Tasks file not found" },
        { status: 404 }
      );
    }

    // Read the file
    let content = fs.readFileSync(tasksPath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Find and replace the status for the specific task
    // Pattern: - **id:** task-001 followed by - **status:** <status>
    const taskIdPattern = new RegExp(
      `(- \\*\\*id:\\*\\* ${taskId}\\n- \\*\\*status:\\*\\* )(\\w+)`,
      "g"
    );

    const updatedMarkdown = markdownContent.replace(taskIdPattern, `$1${status}`);

    if (updatedMarkdown === markdownContent) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      );
    }

    // Update the updated_at date in frontmatter
    frontmatter.updated_at = new Date().toISOString().split("T")[0];

    // Reconstruct the file
    const newContent = matter.stringify(updatedMarkdown, frontmatter);
    fs.writeFileSync(tasksPath, newContent, "utf8");

    return NextResponse.json({
      success: true,
      taskId,
      newStatus: status,
      updatedAt: frontmatter.updated_at,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

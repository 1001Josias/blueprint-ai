import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "..", "..", "projects");

interface UpdateTaskStatusRequest {
  workspace: string;
  projectSlug: string;
  status?: "todo" | "in_progress" | "done" | "blocked";
  subtaskIndex?: number;
  completed?: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body: UpdateTaskStatusRequest = await request.json();
    const { workspace, projectSlug, status, subtaskIndex, completed } = body;

    if (!workspace || !projectSlug || !taskId) {
      return NextResponse.json(
        { error: "Missing required fields: workspace, projectSlug, taskId" },
        { status: 400 }
      );
    }

    const tasksPath = path.join(projectsDirectory, workspace, projectSlug, "tasks.md");

    if (!fs.existsSync(tasksPath)) {
      return NextResponse.json(
        { error: "Tasks file not found" },
        { status: 404 }
      );
    }

    // Read the file
    let content = fs.readFileSync(tasksPath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);
    let updatedMarkdown = markdownContent;

    // Handle Subtask Update
    if (typeof subtaskIndex === "number" && typeof completed === "boolean") {
      // We look for the header (## Task...) followed by the ID
      // And capture until the next TASK header (## ), or horizontal rule (---), or EOF
      // IMPORTANT: We must NOT stop at ### (Subtasks) or #### (Individual subtasks)
      const taskRegex = new RegExp(
        `(#+ [^\\n]*\\n)- \\*\\*id:\\*\\* ${taskId}[\\s\\S]*?(?=\\n---|\\n## |$)`, 
        "g"
      );
      
      const taskMatch = taskRegex.exec(markdownContent);
      
      if (!taskMatch) {
         return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 }
        );
      }

      const taskBlock = taskMatch[0];
      const taskBlockStart = taskMatch.index;

      // 2. Find all subtasks in this block
      // Subtasks start with #### [ ] or #### [x]
      const subtaskRegex = /(#### \[([ x])\])/g;
      let match;
      let currentIndex = 0;
      let targetSubtaskStart = -1;
      let targetSubtaskLength = 0;

      while ((match = subtaskRegex.exec(taskBlock)) !== null) {
        if (currentIndex === subtaskIndex) {
          targetSubtaskStart = match.index;
          targetSubtaskLength = match[0].length;
          break;
        }
        currentIndex++;
      }

      if (targetSubtaskStart === -1) {
        return NextResponse.json(
          { error: `Subtask index ${subtaskIndex} not found in task ${taskId}` },
          { status: 404 }
        );
      }

      // 3. Replace the status character
      const newStatusMark = completed ? "x" : " ";
      const beforeSubtask = taskBlock.substring(0, targetSubtaskStart);
      const afterSubtask = taskBlock.substring(targetSubtaskStart + targetSubtaskLength);
      const newTaskBlock = beforeSubtask + `#### [${newStatusMark}]` + afterSubtask;

      // 4. Replace the task block in the full content
      const beforeTask = markdownContent.substring(0, taskBlockStart);
      const afterTask = markdownContent.substring(taskBlockStart + taskBlock.length);
      updatedMarkdown = beforeTask + newTaskBlock + afterTask;

    } 
    // Handle Main Task Status Update
    else if (status) {
      const validStatuses = ["todo", "in_progress", "done", "blocked"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      const taskIdPattern = new RegExp(
        `(- \\*\\*id:\\*\\* ${taskId}\\n- \\*\\*status:\\*\\* )(\\w+)`,
        "g"
      );

      updatedMarkdown = markdownContent.replace(taskIdPattern, `$1${status}`);
      
      if (updatedMarkdown === markdownContent) {
        return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Either status or (subtaskIndex + completed) must be provided" },
        { status: 400 }
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

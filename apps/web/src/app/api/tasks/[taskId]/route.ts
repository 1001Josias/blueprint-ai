import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "..", "..", "projects");

interface UpdateTaskRequest {
  workspace: string;
  projectSlug: string;
  status?: "todo" | "in_progress" | "done" | "blocked";
  subtaskIndex?: number;
  completed?: boolean;
  // Comment support
  comment?: string;
  commentTarget?: "task" | "subtask";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const body: UpdateTaskRequest = await request.json();
    const {
      workspace,
      projectSlug,
      status,
      subtaskIndex,
      completed,
      comment,
      commentTarget,
    } = body;

    if (!workspace || !projectSlug || !taskId) {
      return NextResponse.json(
        { error: "Missing required fields: workspace, projectSlug, taskId" },
        { status: 400 },
      );
    }

    const tasksPath = path.join(
      projectsDirectory,
      workspace,
      projectSlug,
      "tasks.md",
    );

    if (!fs.existsSync(tasksPath)) {
      return NextResponse.json(
        { error: "Tasks file not found" },
        { status: 404 },
      );
    }

    // Read the file
    const content = fs.readFileSync(tasksPath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);
    let updatedMarkdown = markdownContent;

    // Handle Subtask Update
    if (typeof subtaskIndex === "number" && typeof completed === "boolean") {
      // We look for the header (## Task...) followed by the ID
      // And capture until the next TASK header (## ), or horizontal rule (---), or EOF
      // IMPORTANT: We must NOT stop at ### (Subtasks) or #### (Individual subtasks)
      const taskRegex = new RegExp(
        `(#+ [^\\n]*\\n)- \\*\\*id:\\*\\* ${taskId}[\\s\\S]*?(?=\\n---|\\n## |$)`,
        "g",
      );

      const taskMatch = taskRegex.exec(markdownContent);

      if (!taskMatch) {
        return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 },
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
          {
            error: `Subtask index ${subtaskIndex} not found in task ${taskId}`,
          },
          { status: 404 },
        );
      }

      // 3. Replace the status character
      const newStatusMark = completed ? "x" : " ";
      const beforeSubtask = taskBlock.substring(0, targetSubtaskStart);
      const afterSubtask = taskBlock.substring(
        targetSubtaskStart + targetSubtaskLength,
      );
      const newTaskBlock =
        beforeSubtask + `#### [${newStatusMark}]` + afterSubtask;

      // 4. Replace the task block in the full content
      const beforeTask = markdownContent.substring(0, taskBlockStart);
      const afterTask = markdownContent.substring(
        taskBlockStart + taskBlock.length,
      );
      updatedMarkdown = beforeTask + newTaskBlock + afterTask;
    }
    // Handle Main Task Status Update
    else if (status) {
      const validStatuses = ["todo", "in_progress", "done", "blocked"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 },
        );
      }

      const taskIdPattern = new RegExp(
        `(- \\*\\*id:\\*\\* ${taskId}\\n- \\*\\*status:\\*\\* )(\\w+)`,
        "g",
      );

      updatedMarkdown = markdownContent.replace(taskIdPattern, `$1${status}`);

      if (updatedMarkdown === markdownContent) {
        return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 },
        );
      }
    }
    // Handle Add Comment
    else if (comment && comment.trim()) {
      const commentLine = `- **comment:** ${comment.trim()}`;

      // Find the task block
      const taskRegex = new RegExp(
        `(## Task \\d+:[^\\n]*\\n)- \\*\\*id:\\*\\* ${taskId}[\\s\\S]*?(?=\\n---|\\n## |$)`,
        "g",
      );

      const taskMatch = taskRegex.exec(markdownContent);

      if (!taskMatch) {
        return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 },
        );
      }

      const taskBlock = taskMatch[0];
      const taskBlockStart = taskMatch.index;

      if (commentTarget === "subtask" && typeof subtaskIndex === "number") {
        // Add comment to a specific subtask
        // Find the subtask and insert comment after its description
        const subtaskRegex = /(#### \[[ x]\][^\n]*)/g;
        let match;
        let currentIndex = 0;
        let targetSubtaskEnd = -1;

        while ((match = subtaskRegex.exec(taskBlock)) !== null) {
          if (currentIndex === subtaskIndex) {
            // Find the end of this subtask (next #### or ### or ## or --- or EOF of block)
            const afterMatch = taskBlock.substring(
              match.index + match[0].length,
            );
            const nextSectionMatch = afterMatch.match(
              /\n(?=####|\n###|\n##|\n---)/,
            );

            if (nextSectionMatch) {
              targetSubtaskEnd =
                match.index + match[0].length + nextSectionMatch.index!;
            } else {
              targetSubtaskEnd = taskBlock.length;
            }
            break;
          }
          currentIndex++;
        }

        if (targetSubtaskEnd === -1) {
          return NextResponse.json(
            {
              error: `Subtask index ${subtaskIndex} not found in task ${taskId}`,
            },
            { status: 404 },
          );
        }

        // Insert comment at the end of the subtask content
        const beforeComment = taskBlock.substring(0, targetSubtaskEnd);
        const afterComment = taskBlock.substring(targetSubtaskEnd);
        const newTaskBlock =
          beforeComment.trimEnd() + "\n" + commentLine + afterComment;

        const beforeTask = markdownContent.substring(0, taskBlockStart);
        const afterTask = markdownContent.substring(
          taskBlockStart + taskBlock.length,
        );
        updatedMarkdown = beforeTask + newTaskBlock + afterTask;
      } else {
        // Add comment to the task itself
        // Insert after the last metadata line (before ### Subtasks or end of metadata)
        const subtasksHeaderMatch = taskBlock.match(/\n### Subtasks/);

        let insertPosition: number;
        if (subtasksHeaderMatch && subtasksHeaderMatch.index !== undefined) {
          // Insert before ### Subtasks
          insertPosition = subtasksHeaderMatch.index;
        } else {
          // Find end of metadata lines (lines starting with "- **")
          const metadataEndMatch = taskBlock.match(
            /(?:- \*\*\w+:\*\*[^\n]*\n)+/,
          );
          if (metadataEndMatch) {
            insertPosition =
              metadataEndMatch.index! + metadataEndMatch[0].length;
          } else {
            insertPosition = taskBlock.length;
          }
        }

        const beforeComment = taskBlock.substring(0, insertPosition).trimEnd();
        const afterComment = taskBlock.substring(insertPosition);
        const newTaskBlock = beforeComment + "\n" + commentLine + afterComment;

        const beforeTask = markdownContent.substring(0, taskBlockStart);
        const afterTask = markdownContent.substring(
          taskBlockStart + taskBlock.length,
        );
        updatedMarkdown = beforeTask + newTaskBlock + afterTask;
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Either status, (subtaskIndex + completed), or comment must be provided",
        },
        { status: 400 },
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
      { status: 500 },
    );
  }
}

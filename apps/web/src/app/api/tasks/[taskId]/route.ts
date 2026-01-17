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
  action?: "add_comment" | "edit_comment" | "delete_comment";
  text?: string;
  commentIndex?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body: UpdateTaskRequest = await request.json();
    const { workspace, projectSlug, status, subtaskIndex, completed, comment, commentTarget } = body;

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
    const content = fs.readFileSync(tasksPath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);
    let updatedMarkdown = markdownContent;

    // Handle Subtask Update (Completion Toggle)
    if (typeof subtaskIndex === "number" && typeof completed === "boolean") {
      // ... existing logic for subtask toggle ...
      const taskRegex = new RegExp(
        `(#+ [^\\n]*\\n)- \\*\\*id:\\*\\* ${taskId}[\\s\\S]*?(?=\\n---|\\n## |$)`, 
        "g"
      );
      
      const taskMatch = taskRegex.exec(markdownContent);
      if (!taskMatch) {
         return NextResponse.json({ error: `Task ${taskId} not found` }, { status: 404 });
      }

      const taskBlock = taskMatch[0];
      const taskBlockStart = taskMatch.index;

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
        return NextResponse.json({ error: `Subtask index ${subtaskIndex} not found` }, { status: 404 });
      }

      const newStatusMark = completed ? "x" : " ";
      const beforeSubtask = taskBlock.substring(0, targetSubtaskStart);
      const afterSubtask = taskBlock.substring(targetSubtaskStart + targetSubtaskLength);
      const newTaskBlock = beforeSubtask + `#### [${newStatusMark}]` + afterSubtask;

      const beforeTask = markdownContent.substring(0, taskBlockStart);
      const afterTask = markdownContent.substring(taskBlockStart + taskBlock.length);
      updatedMarkdown = beforeTask + newTaskBlock + afterTask;

    } 
    // Handle Main Task Status Update
    else if (status) {
       // ... existing logic for status update ...
      const validStatuses = ["todo", "in_progress", "done", "blocked"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const taskIdPattern = new RegExp(
        `(- \\*\\*id:\\*\\* ${taskId}\\n- \\*\\*status:\\*\\* )(\\w+)`,
        "g"
      );

      updatedMarkdown = markdownContent.replace(taskIdPattern, `$1${status}`);
      if (updatedMarkdown === markdownContent) {
        return NextResponse.json({ error: `Task ${taskId} not found` }, { status: 404 });
      }
    } 
    // Handle Comment Actions (Add, Edit, Delete)
    else if (comment || body.action) {
      // Logic for comments
      const action = body.action || "add_comment"; // default to add
      const rawText = comment || body.text || "";
      // Escape newlines for storage
      const text = rawText.trim().replace(/\n/g, "\\n");

      if ((action === "add_comment" || action === "edit_comment") && !text) {
         return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
      }
      
      const taskRegex = new RegExp(
        `(## Task \\d+:[^\\n]*\\n)- \\*\\*id:\\*\\* ${taskId}[\\s\\S]*?(?=\\n---|\\n## |$)`,
        "g"
      );
      
      const taskMatch = taskRegex.exec(markdownContent);
      if (!taskMatch) {
        return NextResponse.json({ error: `Task ${taskId} not found` }, { status: 404 });
      }

      let taskBlock = taskMatch[0];
      const taskBlockStart = taskMatch.index;

      // Helper to find subtask range
      const findSubtaskRange = (block: string, index: number) => {
        const subtaskRegex = /(#### \[[ x]\][^\n]*)/g;
        let match;
        let currentIndex = 0;
        
        while ((match = subtaskRegex.exec(block)) !== null) {
          if (currentIndex === index) {
            const start = match.index;
            const afterMatch = block.substring(start + match[0].length);
            const nextSectionMatch = afterMatch.match(/\n(?=####|\n###|\n##|\n---)/);
            const end = nextSectionMatch 
              ? start + match[0].length + nextSectionMatch.index! 
              : block.length;
            return { start, end };
          }
          currentIndex++;
        }
        return null;
      };

      if (commentTarget === "subtask" && typeof subtaskIndex === "number") {
        // --- SUBTASK COMMENT LOGIC ---
        const range = findSubtaskRange(taskBlock, subtaskIndex);
        if (!range) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

        let subtaskContent = taskBlock.substring(range.start, range.end);
        
        if (action === "add_comment") {
          // Indent comment for subtask scope if desired, or just list it below
          // Standard: - **comment:** text
          // For subtask, we want it "inside" the subtask block.
          // Since our parser reads comments *after* subtask title until next subtask, 
          // appending to subtaskContent is correct.
          subtaskContent = subtaskContent.trimEnd() + `\n- **comment:** ${text.trim()}\n`;
        } else if (action === "delete_comment" || action === "edit_comment") {
          // Find the Nth comment in this subtask
          const commentRegex = /(- \*\*comment:\*\* (.*))/g;
          let match;
          let cIndex = 0;
          let newSubtaskContent = subtaskContent;
          const targetIndex = body.commentIndex ?? -1;

          // We need to rebuild the string or replace specific match
          // Easier to split, modify lines, rejoin? 
          // Or define strict regex construction.
          // Let's iterate matches and replace the target one.
          
          const matches = Array.from(subtaskContent.matchAll(commentRegex));
          if (targetIndex >= 0 && targetIndex < matches.length) {
            const targetMatch = matches[targetIndex];
            const start = targetMatch.index!;
            const end = start + targetMatch[0].length;
            
            if (action === "delete_comment") {
              newSubtaskContent = subtaskContent.substring(0, start) + subtaskContent.substring(end);
              // Clean up potential double newlines
            } else { // edit
               newSubtaskContent = subtaskContent.substring(0, start) + `- **comment:** ${text.trim()}` + subtaskContent.substring(end);
            }
            subtaskContent = newSubtaskContent;
          }
        }

        taskBlock = taskBlock.substring(0, range.start) + subtaskContent + taskBlock.substring(range.end);

      } else {
        // --- MAIN TASK COMMENT LOGIC ---
        
        if (action === "add_comment") {
             // Find insertion point (before ### Subtasks or end of metadata)
            const subtasksHeaderMatch = taskBlock.match(/\n### Subtasks/);
            let insertPosition;
            if (subtasksHeaderMatch && subtasksHeaderMatch.index !== undefined) {
              insertPosition = subtasksHeaderMatch.index;
            } else {
              const metadataEndMatch = taskBlock.match(/(?:- \*\*\w+:\*\*[^\n]*\n)+/);
              insertPosition = metadataEndMatch ? metadataEndMatch.index! + metadataEndMatch[0].length : taskBlock.length;
            }

            const before = taskBlock.substring(0, insertPosition).trimEnd();
            const after = taskBlock.substring(insertPosition);
            taskBlock = before + `\n- **comment:** ${text.trim()}` + after;

        } else if (action === "delete_comment" || action === "edit_comment") {
             // Find comments that are NOT inside subtasks
             // This is tricky with regex global on the whole block.
             // Strategy: Extract the "Metadata Section" (before ### Subtasks)
             const subtasksHeaderMatch = taskBlock.match(/\n### Subtasks/);
             const metadataEnd = subtasksHeaderMatch?.index ?? taskBlock.length;
             let metadataSection = taskBlock.substring(0, metadataEnd);
             const rest = taskBlock.substring(metadataEnd);

             const commentRegex = /(- \*\*comment:\*\* (.*))/g;
             const matches = Array.from(metadataSection.matchAll(commentRegex));
             const targetIndex = body.commentIndex ?? -1;

             if (targetIndex >= 0 && targetIndex < matches.length) {
                const targetMatch = matches[targetIndex];
                const start = targetMatch.index!;
                const end = start + targetMatch[0].length;

                if (action === "delete_comment") {
                  metadataSection = metadataSection.substring(0, start) + metadataSection.substring(end);
                } else {
                  metadataSection = metadataSection.substring(0, start) + `- **comment:** ${text.trim()}` + metadataSection.substring(end);
                }
                taskBlock = metadataSection + rest;
             }
        }
      }

      // Reconstruct full file
      const beforeTask = markdownContent.substring(0, taskBlockStart);
      const afterTask = markdownContent.substring(taskBlockStart + taskMatch[0].length); // Use original length
      updatedMarkdown = beforeTask + taskBlock + afterTask;

    } else {
      return NextResponse.json(
        { error: "Invalid request" },
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

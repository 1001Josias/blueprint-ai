import { NextRequest, NextResponse } from "next/server";
import { updateProjectTasksOrder } from "@/lib/markdown";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspace: string; slug: string }> }
) {
  try {
    const { workspace, slug } = await params;
    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "taskIds array is required" },
        { status: 400 }
      );
    }

    await updateProjectTasksOrder(workspace, slug, taskIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}

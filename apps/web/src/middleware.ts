import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the token from the Authorization header
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // Simple hardcoded mapping for MVP (as per PRD)
  // In production this would come from env vars or database
  // Example: Key_WorkspaceA=token123
  const workspaceMap: Record<string, string> = {
    token123: "default", // Mapping token123 to default workspace for testing
    // Add more mappings here or read from process.env
  };

  // If we have a token, try to find the workspace
  let workspace: string | undefined;

  if (token && workspaceMap[token]) {
    workspace = workspaceMap[token];
  } else if (token) {
    // Basic mechanism to pull from env if available
    // We iterate over env vars starting with KEY_
    // Note: iterating process.env in Edge Runtime (middleware) might be limited
    // depending on the platform, but usually fine for defined vars.
    // For now we stick to the hardcoded map or specific env vars.
  }

  // Clone the request headers and set the x-workspace header
  const requestHeaders = new Headers(request.headers);
  if (workspace) {
    requestHeaders.set("x-workspace", workspace);
  }

  // Return the response with the new headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Config to match API routes and potentially pages if we want to enforce on UI
export const config = {
  matcher: ["/api/:path*", "/projects/:path*"],
};

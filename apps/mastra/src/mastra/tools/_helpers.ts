import type { RequestContext } from "@mastra/core/request-context";
import type { Role } from "../domain/types";

// Read the JWT-derived identity from RequestContext inside a tool.
// requireAuth() middleware populates these for every authed route, and they
// propagate into agents/tools through requestContext.
export function ctxFromTool(requestContext: RequestContext | undefined): {
  userId: string;
  organizationId: string;
  role: Role;
} {
  if (!requestContext) {
    throw new Error("Tool invoked without a RequestContext");
  }
  const userId = requestContext.get("userId") as string | undefined;
  const organizationId = requestContext.get("organizationId") as string | undefined;
  const role = requestContext.get("role") as Role | undefined;
  if (!userId || !organizationId || !role) {
    throw new Error(
      "Tool RequestContext missing userId/organizationId/role; requireAuth() must run first",
    );
  }
  return { userId, organizationId, role };
}

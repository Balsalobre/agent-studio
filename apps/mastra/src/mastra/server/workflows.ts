import { registerApiRoute } from "@mastra/core/server";
import { streamSSE } from "hono/streaming";

import { getResourcesByIds } from "../domain/learning";
import { applyRagContext } from "../tools/rag-query";
import type { Role } from "../domain/types";
import { ctxFrom, requireAuth } from "./auth";

const httpError = (
  code: "BAD_REQUEST" | "FORBIDDEN" | "NOT_FOUND",
  message: string,
) => ({ error: { code, message } });

// Which role may run each workflow. The three learner buttons and the three
// manager buttons each map to one workflow id here.
const WORKFLOW_ROLES: Record<string, Role> = {
  "weekly-goal": "learner",
  "quick-review": "learner",
  "reexplain-lesson": "learner",
  "role-play": "learner",
  "team-at-risk": "manager",
  "assign-route": "manager",
  "team-digest": "manager",
};

// POST /workflows/:id/run — runs a button-backing workflow and streams its
// composed reply back over SSE, reusing the same frame shapes as /chat
// (resource-card, text deltas, done) so the frontend consumer is identical.
export const runWorkflowRoute = registerApiRoute("/workflows/:id/run", {
  method: "POST",
  middleware: [requireAuth()],
  handler: async (c) => {
    const { userId, organizationId, role } = ctxFrom(c);
    const id = c.req.param("id");

    const requiredRole = WORKFLOW_ROLES[id];
    if (!requiredRole) {
      return c.json(httpError("NOT_FOUND", `Unknown workflow '${id}'`), 404);
    }
    if (role !== requiredRole) {
      return c.json(httpError("FORBIDDEN", `Requires role '${requiredRole}'`), 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const topic = typeof body?.topic === "string" ? body.topic : undefined;

    const mastra = c.get("mastra");
    // Look up by the workflow's `id` property (kebab-case, == the URL param),
    // not the camelCase registration key.
    const workflow = mastra.getWorkflowById(id);
    if (!workflow) {
      return c.json(httpError("NOT_FOUND", `Workflow '${id}' not registered`), 404);
    }

    const requestContext = c.get("requestContext");
    applyRagContext(requestContext, organizationId);

    return streamSSE(c, async (sse) => {
      let reply = "";
      let resourceIds: string[] = [];
      const doneExtra: Record<string, unknown> = {};
      try {
        const run = await workflow.createRun();
        const result = await run.start({
          inputData: { organizationId, userId, topic },
          requestContext,
        });

        if (result.status !== "success") {
          const message =
            result.status === "failed"
              ? (result as { error?: { message?: string } }).error?.message ?? "Workflow failed"
              : `Workflow ${result.status}`;
          await sse.writeSSE({
            event: "error",
            data: JSON.stringify({ type: "error", message }),
          });
          return;
        }

        const out = result.result as {
          reply?: string;
          resourceIds?: string[];
          roleplay?: unknown;
        };
        reply = out?.reply ?? "";
        resourceIds = Array.isArray(out?.resourceIds) ? out.resourceIds : [];
        // Some workflows (role-play) carry extra setup the frontend needs to
        // continue the interaction; forward it in the done frame.
        if (out?.roleplay) doneExtra.roleplay = out.roleplay;
      } catch (err) {
        await sse.writeSSE({
          event: "error",
          data: JSON.stringify({ type: "error", message: (err as Error).message }),
        });
        return;
      }

      // Resource cards first, so they're already in place as the text types in.
      if (resourceIds.length) {
        try {
          const dtos = await getResourcesByIds(organizationId, resourceIds);
          for (const r of dtos) {
            await sse.writeSSE({ data: JSON.stringify({ type: "resource-card", resource: r }) });
          }
        } catch {
          // Cards are best-effort; the text reply still goes out.
        }
      }

      // Stream the reply in small chunks for a typing feel.
      const CHUNK = 36;
      for (let i = 0; i < reply.length; i += CHUNK) {
        await sse.writeSSE({
          data: JSON.stringify({ type: "text", delta: reply.slice(i, i + CHUNK) }),
        });
        await new Promise((r) => setTimeout(r, 12));
      }

      await sse.writeSSE({
        event: "done",
        data: JSON.stringify({ type: "done", workflowId: id, ...doneExtra }),
      });
    });
  },
});

export const workflowRoutes = [runWorkflowRoute];

import { registerApiRoute } from "@mastra/core/server";
import { streamSSE } from "hono/streaming";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { prisma } from "../domain/prisma";
import { getRouteForOrg } from "../domain/route";
import { applyRagContext } from "../tools/rag-query";
import { ctxFrom, requireAuth, requireRole } from "./auth";

const httpError = (
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND",
  message: string,
) => ({ error: { code, message } });

const chatBody = z.object({
  message: z.string().min(1),
  threadId: z.string().optional(),
});

// POST /chat — SSE stream of the Bonsai agent. Per DOC 06 §4.
//
// Emits `data: {type:'text',delta:'...'}` lines while the agent streams its
// reply. When the stream ends we inspect the tool results and, if the agent
// called markStepCompleteTool, emit a final `event: done` carrying the
// completed stepId so the frontend can refresh progress.
export const chatRoute = registerApiRoute("/chat", {
  method: "POST",
  middleware: [requireAuth(), requireRole("learner")],
  handler: async (c) => {
    const { userId, organizationId } = ctxFrom(c);

    const raw = await c.req.json().catch(() => null);
    const parsed = chatBody.safeParse(raw);
    if (!parsed.success) {
      return c.json(httpError("BAD_REQUEST", "Body must be { message, threadId? }"), 400);
    }

    const threadId = parsed.data.threadId ?? randomUUID();
    const resource = `org:${organizationId}:user:${userId}`;

    const requestContext = c.get("requestContext");
    applyRagContext(requestContext, organizationId);

    const mastra = c.get("mastra");
    const bonsai = mastra.getAgent("bonsaiAgent");

    return streamSSE(c, async (sse) => {
      let stream;
      try {
        stream = await bonsai.stream(parsed.data.message, {
          memory: { resource, thread: threadId },
          requestContext,
        });
      } catch (err) {
        await sse.writeSSE({
          event: "error",
          data: JSON.stringify({ type: "error", message: (err as Error).message }),
        });
        return;
      }

      try {
        for await (const chunk of stream.fullStream) {
          if (chunk.type === "text-delta") {
            const delta = (chunk as { payload: { text: string } }).payload.text;
            if (delta) {
              await sse.writeSSE({
                data: JSON.stringify({ type: "text", delta }),
              });
            }
          } else if (chunk.type === "tool-call") {
            // Surface tool invocations so the frontend can render
            // "Buscando…" / "Cargando recurso…" indicators while the
            // agent reasons. We send only metadata (toolName + id), not
            // arguments, to keep the wire compact and avoid leaking
            // internals to the UI.
            const p = (chunk as { payload: { toolName?: string; toolCallId?: string } }).payload;
            if (p?.toolName) {
              await sse.writeSSE({
                data: JSON.stringify({
                  type: "tool-call",
                  toolName: p.toolName,
                  toolCallId: p.toolCallId,
                }),
              });
            }
          } else if (chunk.type === "tool-result") {
            // Companion to tool-call — tells the UI it can clear the
            // pending indicator.
            const p = (chunk as { payload: { toolName?: string; toolCallId?: string; result?: unknown } }).payload;
            if (p?.toolName) {
              await sse.writeSSE({
                data: JSON.stringify({
                  type: "tool-result",
                  toolName: p.toolName,
                  toolCallId: p.toolCallId,
                }),
              });

              // When the agent surfaces a resource (via present-resource
              // or recommend-resources), emit a dedicated frame so the
              // UI can render a rich card next to the streaming text.
              // We only forward the public DTO fields; no chunks or
              // embeddings ever cross this boundary.
              if (p.toolName === "present-resource") {
                const r = (p.result as { resource?: unknown } | null | undefined)?.resource;
                if (r) {
                  await sse.writeSSE({
                    data: JSON.stringify({ type: "resource-card", resource: r }),
                  });
                }
              } else if (p.toolName === "recommend-resources") {
                const rs = (p.result as { resources?: unknown[] } | null | undefined)?.resources;
                if (Array.isArray(rs)) {
                  for (const r of rs) {
                    await sse.writeSSE({
                      data: JSON.stringify({ type: "resource-card", resource: r }),
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        await sse.writeSSE({
          event: "error",
          data: JSON.stringify({ type: "error", message: (err as Error).message }),
        });
        return;
      }

      // After streaming, look at tool results to detect markStepComplete.
      let stepCompleted: string | undefined;
      try {
        const results = await stream.toolResults;
        for (const r of results) {
          const payload = (r as { payload?: { toolName?: string; result?: unknown } }).payload;
          if (payload?.toolName === "mark-step-complete") {
            const result = payload.result as { stepId?: string } | undefined;
            if (result?.stepId) stepCompleted = result.stepId;
          }
        }
      } catch {
        // Ignore — best-effort detection.
      }

      await sse.writeSSE({
        event: "done",
        data: JSON.stringify({ type: "done", threadId, ...(stepCompleted ? { stepCompleted } : {}) }),
      });
    });
  },
});

// GET /route — learner reads their org's route (seed JSON, read-only).
export const getRouteRoute = registerApiRoute("/route", {
  method: "GET",
  middleware: [requireAuth(), requireRole("learner")],
  handler: async (c) => {
    const { organizationId } = ctxFrom(c);
    const route = await getRouteForOrg(organizationId);
    if (!route) {
      return c.json(httpError("NOT_FOUND", "No route configured for this organisation"), 404);
    }
    return c.json({ route });
  },
});

// GET /progress — learner reads their own progress rows.
export const getProgressRoute = registerApiRoute("/progress", {
  method: "GET",
  middleware: [requireAuth(), requireRole("learner")],
  handler: async (c) => {
    const { organizationId, userId } = ctxFrom(c);
    const rows = await prisma.learnerProgress.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: "desc" },
    });
    return c.json({
      progress: rows.map((p) => ({
        routeId: p.routeId,
        stepId: p.stepId,
        status: p.status,
        evidence: p.evidence,
        completedAt: p.completedAt?.toISOString(),
      })),
    });
  },
});

// POST /resources/:id/open — learner "consumes" a resource. If the resource
// is associated with a step whose completion.type === 'consume', that step
// is auto-completed (UC4 D-4.2).
export const openResourceRoute = registerApiRoute("/resources/:id/open", {
  method: "POST",
  middleware: [requireAuth(), requireRole("learner")],
  handler: async (c) => {
    const { organizationId, userId } = ctxFrom(c);
    const resourceId = c.req.param("id");

    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, organizationId },
      select: { id: true },
    });
    if (!resource) {
      return c.json(httpError("NOT_FOUND", "Resource not found in this organisation"), 404);
    }

    const route = await getRouteForOrg(organizationId);
    if (!route) return c.json({ ok: true });

    // Find a step that contains this resource and whose completion is 'consume'.
    const consumeStep = route.steps.find(
      (s) => s.completion.type === "consume" && s.resourceIds.includes(resourceId),
    );
    if (!consumeStep) return c.json({ ok: true });

    // Idempotent: if already completed, don't re-fire.
    const existing = await prisma.learnerProgress.findUnique({
      where: {
        userId_routeId_stepId: { userId, routeId: route.id, stepId: consumeStep.id },
      },
      select: { status: true },
    });
    if (existing?.status === "completed") {
      return c.json({ ok: true });
    }

    await prisma.learnerProgress.upsert({
      where: {
        userId_routeId_stepId: { userId, routeId: route.id, stepId: consumeStep.id },
      },
      update: {
        status: "completed",
        completedAt: new Date(),
        evidence: { via: "open-resource", resourceId },
      },
      create: {
        organizationId,
        userId,
        routeId: route.id,
        stepId: consumeStep.id,
        status: "completed",
        completedAt: new Date(),
        evidence: { via: "open-resource", resourceId },
      },
    });

    return c.json({ ok: true, completedStep: consumeStep.id });
  },
});

// GET /threads — list the learner's recent Bonsai threads via the agent's
// Memory store. Filtered by the same resourceId convention used in /chat
// (org:{orgId}:user:{userId}) so a learner can only see their own threads.
export const listThreadsRoute = registerApiRoute("/threads", {
  method: "GET",
  middleware: [requireAuth(), requireRole("learner")],
  handler: async (c) => {
    const { organizationId, userId } = ctxFrom(c);
    const mastra = c.get("mastra") as { getAgent: (id: string) => { getMemory: () => Promise<unknown> } };
    const agent = mastra.getAgent("bonsaiAgent");
    const memory = (await agent.getMemory()) as
      | {
          listThreads: (opts: {
            filter: { resourceId: string };
            page: number;
            perPage: number;
            orderBy: { field: "createdAt" | "updatedAt"; direction: "ASC" | "DESC" };
          }) => Promise<{
            threads: Array<{ id: string; title?: string; createdAt: Date; updatedAt: Date }>;
            total: number;
          }>;
        }
      | null;

    if (!memory) {
      return c.json({ threads: [], total: 0 });
    }

    const resource = `org:${organizationId}:user:${userId}`;
    const perPageRaw = c.req.query("perPage");
    const perPage = Math.min(Math.max(parseInt(perPageRaw ?? "20", 10) || 20, 1), 50);

    const result = await memory.listThreads({
      filter: { resourceId: resource },
      page: 0,
      perPage,
      orderBy: { field: "updatedAt", direction: "DESC" },
    });

    return c.json({
      threads: result.threads.map((t) => ({
        id: t.id,
        title: t.title ?? null,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
      })),
      total: result.total,
    });
  },
});

export const learnerRoutes = [chatRoute, getRouteRoute, getProgressRoute, openResourceRoute, listThreadsRoute];

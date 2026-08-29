import { registerApiRoute } from "@mastra/core/server";
import { streamSSE } from "hono/streaming";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { RolePlayConfig } from "../agents/roleplay";
import { ctxFrom, requireAuth, requireRole } from "./auth";

const httpError = (code: "BAD_REQUEST", message: string) => ({ error: { code, message } });

const rolePlayConfigSchema = z.object({
  title: z.string(),
  personaName: z.string(),
  persona: z.string(),
  learnerRole: z.string(),
  scenario: z.string(),
  objective: z.string(),
  successCriteria: z.array(z.string()),
  difficulty: z.enum(["fácil", "media", "difícil"]),
  openingLine: z.string(),
});

const body = z.object({
  message: z.string().min(1),
  threadId: z.string().optional(),
  roleplay: rolePlayConfigSchema,
  feedback: z.boolean().optional(),
});

// POST /roleplay/chat — one turn of a role-play practice. The scenario config
// is re-sent each turn and injected into the request context so the role-play
// agent's dynamic instructions stay in character (or switch to coaching when
// `feedback` is true). Streams text using the same SSE frames as /chat.
export const rolePlayChatRoute = registerApiRoute("/roleplay/chat", {
  method: "POST",
  middleware: [requireAuth(), requireRole("learner")],
  handler: async (c) => {
    const { userId, organizationId } = ctxFrom(c);

    const raw = await c.req.json().catch(() => null);
    const parsed = body.safeParse(raw);
    if (!parsed.success) {
      return c.json(httpError("BAD_REQUEST", "Body must be { message, roleplay, threadId?, feedback? }"), 400);
    }

    const threadId = parsed.data.threadId ?? randomUUID();
    const resource = `org:${organizationId}:user:${userId}:roleplay`;

    const requestContext = c.get("requestContext");
    requestContext.set("rolePlay", parsed.data.roleplay as RolePlayConfig);
    requestContext.set("rolePlayFeedback", Boolean(parsed.data.feedback));

    const mastra = c.get("mastra");
    const agent = mastra.getAgent("rolePlayAgent");

    return streamSSE(c, async (sse) => {
      let stream;
      try {
        stream = await agent.stream(parsed.data.message, {
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
              await sse.writeSSE({ data: JSON.stringify({ type: "text", delta }) });
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

      await sse.writeSSE({
        event: "done",
        data: JSON.stringify({ type: "done", threadId }),
      });
    });
  },
});

export const rolePlayRoutes = [rolePlayChatRoute];

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { prisma } from "../domain/prisma";
import { getRouteForOrg } from "../domain/route";
import { ctxFromTool } from "./_helpers";

export const getRouteAndProgressTool = createTool({
  id: "get-route-and-progress",
  description:
    "Get the onboarding route for the current learner's organisation and the learner's progress per step. Call at the start of a session to ground guidance.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    route: z
      .object({
        id: z.string(),
        title: z.string(),
        steps: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
            title: z.string(),
            objective: z.string(),
            resourceIds: z.array(z.string()),
            // Full completion details so Bonsai can present questions or
            // evaluation prompts faithfully (UC4 §3). For quiz steps this
            // exposes the answer key — that's fine, the agent operates
            // inside the trust boundary; the grade-quiz tool is what the
            // server uses to actually score answers.
            completion: z.union([
              z.object({ type: z.literal("consume") }),
              z.object({
                type: z.literal("evaluation"),
                prompt: z.string(),
                rubric: z.string(),
              }),
              z.object({
                type: z.literal("quiz"),
                passScore: z.number(),
                questions: z.array(
                  z.object({
                    q: z.string(),
                    options: z.array(z.string()),
                    answer: z.number().int(),
                  }),
                ),
              }),
            ]),
          }),
        ),
      })
      .nullable(),
    progress: z.array(
      z.object({
        stepId: z.string(),
        status: z.enum(["pending", "in_progress", "completed"]),
        completedAt: z.string().nullable(),
      }),
    ),
    currentStepId: z.string().nullable(),
  }),
  execute: async (_input, context) => {
    const { organizationId, userId } = ctxFromTool(context?.requestContext);
    const route = await getRouteForOrg(organizationId);

    const progressRows = route
      ? await prisma.learnerProgress.findMany({
          where: { organizationId, userId, routeId: route.id },
          select: { stepId: true, status: true, completedAt: true },
        })
      : [];

    const progress = progressRows.map((p) => ({
      stepId: p.stepId,
      status: p.status,
      completedAt: p.completedAt?.toISOString() ?? null,
    }));

    // The current step is the first non-completed step by order.
    let currentStepId: string | null = null;
    if (route) {
      const completed = new Set(
        progress.filter((p) => p.status === "completed").map((p) => p.stepId),
      );
      const ordered = [...route.steps].sort((a, b) => a.order - b.order);
      currentStepId = ordered.find((s) => !completed.has(s.id))?.id ?? null;
    }

    return {
      route: route
        ? {
            id: route.id,
            title: route.title,
            steps: route.steps.map((s) => ({
              id: s.id,
              order: s.order,
              title: s.title,
              objective: s.objective,
              resourceIds: s.resourceIds,
              completion: s.completion,
            })),
          }
        : null,
      progress,
      currentStepId,
    };
  },
});

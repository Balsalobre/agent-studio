import { createTool } from "@mastra/core/tools";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../domain/prisma";
import { findStep, getRouteForOrg } from "../domain/route";
import { ctxFromTool } from "./_helpers";

export const markStepCompleteTool = createTool({
  id: "mark-step-complete",
  description:
    "Mark a route step as completed for the current learner. Optionally include evidence (e.g. quiz score, evaluation summary, consume timestamp). Idempotent: re-completing a step is a no-op.",
  inputSchema: z.object({
    routeId: z.string(),
    stepId: z.string(),
    evidence: z.record(z.string(), z.unknown()).optional(),
  }),
  outputSchema: z.object({
    routeId: z.string(),
    stepId: z.string(),
    status: z.enum(["completed"]),
    nextStepId: z.string().nullable(),
  }),
  execute: async ({ routeId, stepId, evidence }, context) => {
    const { organizationId, userId } = ctxFromTool(context?.requestContext);
    const route = await getRouteForOrg(organizationId);
    if (!route || route.id !== routeId) {
      throw new Error(`Route ${routeId} not found for current org`);
    }
    const step = findStep(route, stepId);
    if (!step) throw new Error(`Step ${stepId} not found in route ${routeId}`);

    await prisma.learnerProgress.upsert({
      where: { userId_routeId_stepId: { userId, routeId, stepId } },
      update: {
        status: "completed",
        completedAt: new Date(),
        evidence: (evidence ?? {}) as Prisma.InputJsonValue,
      },
      create: {
        organizationId,
        userId,
        routeId,
        stepId,
        status: "completed",
        completedAt: new Date(),
        evidence: (evidence ?? {}) as Prisma.InputJsonValue,
      },
    });

    const ordered = [...route.steps].sort((a, b) => a.order - b.order);
    const idx = ordered.findIndex((s) => s.id === stepId);
    const nextStepId = idx >= 0 && idx + 1 < ordered.length ? ordered[idx + 1]!.id : null;

    return { routeId, stepId, status: "completed" as const, nextStepId };
  },
});

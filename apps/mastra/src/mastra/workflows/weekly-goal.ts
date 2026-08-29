import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { narrate } from "../agents/composer";
import { getResourcesByIds, getRouteProgressSnapshot } from "../domain/learning";
import { recommendResources } from "../domain/recommend";

// Button: "¿Qué toca hoy?" (learner). Picks the next focus steps of the route
// and frames them as the week's goal, with the right resources + a couple of
// complementary recommendations.

const inputSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  topic: z.string().optional(),
});

const replySchema = z.object({
  reply: z.string(),
  resourceIds: z.array(z.string()),
});

const dataSchema = z.object({
  routeTitle: z.string(),
  doneCount: z.number(),
  totalCount: z.number(),
  focus: z.array(
    z.object({
      title: z.string(),
      objective: z.string(),
      resources: z.array(z.object({ title: z.string(), type: z.string() })),
    }),
  ),
  recommended: z.array(z.object({ title: z.string(), type: z.string() })),
  resourceIds: z.array(z.string()),
});

const loadGoalData = createStep({
  id: "load-goal-data",
  description: "Pick the next focus steps + complementary recommendations",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const { organizationId, userId } = inputData;
    const snap = await getRouteProgressSnapshot(organizationId, userId);

    // The next up-to-3 pending steps from the current position onward.
    const pending = snap.steps.filter((s) => s.status !== "completed").slice(0, 3);

    const focusResourceIds = pending.flatMap((s) => s.step.resourceIds);
    const dtos = await getResourcesByIds(organizationId, focusResourceIds);
    const dtoById = new Map(dtos.map((d) => [d.id, d]));

    const focus = pending.map(({ step }) => ({
      title: step.title,
      objective: step.objective,
      resources: step.resourceIds
        .map((id) => dtoById.get(id))
        .filter(Boolean)
        .map((d) => ({ title: d!.title, type: d!.type })),
    }));

    // Complementary recommendations beyond the route, seeded by the focus.
    const query =
      inputData.topic ||
      pending.map((s) => s.step.title).join(". ") ||
      snap.route?.title ||
      "onboarding";
    const recs = (await recommendResources({ organizationId, query, topK: 4 }))
      .filter((r) => !focusResourceIds.includes(r.id))
      .slice(0, 2);

    return {
      routeTitle: snap.route?.title ?? "Tu ruta",
      doneCount: snap.doneCount,
      totalCount: snap.totalCount,
      focus,
      recommended: recs.map((r) => ({ title: r.title, type: r.type })),
      resourceIds: [...focusResourceIds, ...recs.map((r) => r.id)],
    };
  },
});

const composeGoal = createStep({
  id: "compose-goal",
  description: "Write the weekly goal in Bonsai's voice",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const prompt = `Redacta el **objetivo de la semana** para un learner.

Datos:
- Ruta: ${inputData.routeTitle}
- Progreso: ${inputData.doneCount} de ${inputData.totalCount} pasos completados
- Pasos foco de esta semana (en orden): ${JSON.stringify(inputData.focus, null, 2)}
- Recomendaciones complementarias: ${JSON.stringify(inputData.recommended)}

Estructura sugerida:
🎯 **Tu objetivo de esta semana**
- Una frase motivadora con el progreso (${inputData.doneCount}/${inputData.totalCount}).
- Lista los pasos foco con su objetivo y los recursos asociados (por título).
- Si hay recomendaciones, añádelas como "Para ir más allá".
- Cierra con una llamada a la acción para empezar el primer paso.`;

    const reply = await narrate(mastra, prompt);
    return { reply, resourceIds: inputData.resourceIds };
  },
});

export const weeklyGoalWorkflow = createWorkflow({
  id: "weekly-goal",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadGoalData)
  .then(composeGoal);

weeklyGoalWorkflow.commit();

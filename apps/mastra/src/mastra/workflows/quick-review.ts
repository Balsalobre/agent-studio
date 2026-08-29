import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { narrate } from "../agents/composer";
import { getResourcesByIds, getRouteProgressSnapshot } from "../domain/learning";

// Button: "Repaso en 5 min" (learner). Takes the most relevant recent step and
// turns it into a tiny review: a quick recap + two flashcards.

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
  stepTitle: z.string(),
  objective: z.string(),
  resources: z.array(
    z.object({ title: z.string(), type: z.string(), description: z.string() }),
  ),
  resourceIds: z.array(z.string()),
});

const loadReviewData = createStep({
  id: "load-review-data",
  description: "Pick the step to review (last completed, else current)",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const { organizationId, userId } = inputData;
    const snap = await getRouteProgressSnapshot(organizationId, userId);

    // Prefer the last completed step (something to consolidate); fall back to
    // the current step if nothing is done yet.
    const target = snap.lastCompletedStep ?? snap.currentStep ?? snap.steps[0]?.step ?? null;
    if (!target) {
      return { stepTitle: "Tu ruta", objective: "", resources: [], resourceIds: [] };
    }

    const dtos = await getResourcesByIds(organizationId, target.resourceIds);
    return {
      stepTitle: target.title,
      objective: target.objective,
      resources: dtos.map((d) => ({
        title: d.title,
        type: d.type,
        description: (d.metadata.description as string) ?? "",
      })),
      resourceIds: target.resourceIds,
    };
  },
});

const composeReview = createStep({
  id: "compose-review",
  description: "Write a 5-minute review with flashcards",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const prompt = `Crea un **repaso exprés de 5 minutos** para un learner.

Datos del paso a repasar:
- Título: ${inputData.stepTitle}
- Objetivo: ${inputData.objective}
- Recursos: ${JSON.stringify(inputData.resources, null, 2)}

Estructura:
⏱️ **Repaso de 5 minutos — ${inputData.stepTitle}**
- **En 3 ideas**: tres viñetas con lo esencial del paso (basadas en el objetivo y la descripción de los recursos).
- **Pon a prueba tu memoria**: 2 flashcards en formato "**P:** … / **R:** …".
- Cierra invitando a abrir el recurso si quiere profundizar.

No inventes datos que no estén arriba; si la descripción es escasa, apóyate en el objetivo.`;

    const reply = await narrate(mastra, prompt);
    return { reply, resourceIds: inputData.resourceIds };
  },
});

export const quickReviewWorkflow = createWorkflow({
  id: "quick-review",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadReviewData)
  .then(composeReview);

quickReviewWorkflow.commit();

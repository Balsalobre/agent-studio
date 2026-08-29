import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { narrate } from "../agents/composer";
import { getTeamSnapshot } from "../domain/team";

// Button: "¿Quién necesita ayuda?" (manager). Surfaces at-risk learners with a
// concrete suggested nudge per person.

const inputSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  topic: z.string().optional(),
});

const replySchema = z.object({
  reply: z.string(),
  resourceIds: z.array(z.string()),
});

const memberSchema = z.object({
  name: z.string(),
  pct: z.number(),
  lastActiveDays: z.number(),
  trend7d: z.number(),
});

const dataSchema = z.object({
  routeTitle: z.string(),
  teamSize: z.number(),
  atRisk: z.array(memberSchema),
});

const loadRisk = createStep({
  id: "load-risk",
  description: "Compute the at-risk members of the team",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const snap = await getTeamSnapshot(inputData.organizationId);
    const atRisk = snap.members
      .filter((m) => m.risk)
      .map((m) => ({
        name: m.name,
        pct: m.pct,
        lastActiveDays: m.lastActiveDays,
        trend7d: m.trend7d,
      }));
    return { routeTitle: snap.routeTitle, teamSize: snap.members.length, atRisk };
  },
});

const composeBriefing = createStep({
  id: "compose-briefing",
  description: "Prioritised briefing on who needs help",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const prompt = `Eres el copiloto de un manager de formación. Redacta un **informe priorizado** de quién necesita ayuda.

Equipo: ${inputData.teamSize} personas en la ruta "${inputData.routeTitle}".
Personas en riesgo (ordenadas de más a menos urgente): ${JSON.stringify(inputData.atRisk, null, 2)}

Estructura:
🚨 **Atención prioritaria**
- Si no hay nadie en riesgo, felicítale y dilo claro.
- Para cada persona: nombre, motivo del riesgo (días sin actividad y % de progreso) y **una acción concreta** sugerida (ej.: mensaje de ánimo, reunión 1:1, reasignar un recurso más corto).
- Cierra con una recomendación general de seguimiento.

No inventes personas que no estén en la lista.`;

    const reply = await narrate(mastra, prompt);
    return { reply, resourceIds: [] };
  },
});

export const teamAtRiskWorkflow = createWorkflow({
  id: "team-at-risk",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadRisk)
  .then(composeBriefing);

teamAtRiskWorkflow.commit();

import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { narrate } from "../agents/composer";
import { aggregateTeamKpis, getTeamSnapshot } from "../domain/team";

// Button: "Resumen del equipo" (manager). A weekly digest of team progress —
// the manager's analogue of the learner newsletter.

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
  kpis: z.object({
    teamSize: z.number(),
    avgProgress: z.number(),
    atRiskCount: z.number(),
    completedCount: z.number(),
    topMover: z.object({ name: z.string(), trend7d: z.number() }).nullable(),
    laggard: z.object({ name: z.string(), pct: z.number() }).nullable(),
  }),
});

const loadDigest = createStep({
  id: "load-digest",
  description: "Aggregate team KPIs",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const snap = await getTeamSnapshot(inputData.organizationId);
    const k = aggregateTeamKpis(snap);
    return {
      routeTitle: snap.routeTitle,
      kpis: {
        teamSize: k.teamSize,
        avgProgress: k.avgProgress,
        atRiskCount: k.atRiskCount,
        completedCount: k.completedCount,
        topMover: k.topMover ? { name: k.topMover.name, trend7d: k.topMover.trend7d } : null,
        laggard: k.laggard ? { name: k.laggard.name, pct: k.laggard.pct } : null,
      },
    };
  },
});

const composeDigest = createStep({
  id: "compose-digest",
  description: "Write the weekly team digest",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const prompt = `Eres el copiloto de un manager de formación. Redacta el **resumen semanal del equipo**.

Ruta: ${inputData.routeTitle}
KPIs: ${JSON.stringify(inputData.kpis, null, 2)}

Estructura:
📊 **Resumen de la semana**
- Una frase de titular sobre cómo va el equipo (usa el progreso medio y el tamaño).
- **Cifras clave**: progreso medio, nº en riesgo, nº que ha completado.
- **Destacado**: menciona al que más ha avanzado (topMover) y a quien va más rezagado (laggard), con tacto.
- **Acción recomendada**: una sola, concreta, para esta semana.

Usa solo los datos de arriba. No inventes cifras ni nombres.`;

    const reply = await narrate(mastra, prompt);
    return { reply, resourceIds: [] };
  },
});

export const teamDigestWorkflow = createWorkflow({
  id: "team-digest",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadDigest)
  .then(composeDigest);

teamDigestWorkflow.commit();

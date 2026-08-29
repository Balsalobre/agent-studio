import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { narrate } from "../agents/composer";
import { getTeamSnapshot } from "../domain/team";

// Button: "Asignar / ajustar ruta" (manager). Proposes route assignments per
// person from the catalogue. The write stays human-confirmed — this only
// drafts the proposal.

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
  members: z.array(
    z.object({ name: z.string(), pct: z.number(), routeTitle: z.string(), risk: z.boolean() }),
  ),
  catalog: z.array(z.object({ title: z.string(), focus: z.string() })),
});

const loadAssign = createStep({
  id: "load-assign",
  description: "Load the team + route catalogue",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const snap = await getTeamSnapshot(inputData.organizationId);
    return {
      members: snap.members.map((m) => ({
        name: m.name,
        pct: m.pct,
        routeTitle: m.routeTitle,
        risk: m.risk,
      })),
      catalog: snap.catalog.map((c) => ({ title: c.title, focus: c.focus })),
    };
  },
});

const composeProposal = createStep({
  id: "compose-proposal",
  description: "Draft a route-assignment proposal",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const prompt = `Eres el copiloto de un manager de formación. Propón **asignaciones de ruta** para el equipo.

Equipo (persona, % en su ruta actual, en riesgo): ${JSON.stringify(inputData.members, null, 2)}
Catálogo de rutas disponibles: ${JSON.stringify(inputData.catalog, null, 2)}

Criterio:
- Quien va muy avanzado (>=80%) → propón una ruta nueva del catálogo para seguir creciendo.
- Quien va bajo o está en riesgo → propón un refuerzo o mantener la actual con acompañamiento.
- El resto → ajuste fino.

Estructura:
🧭 **Propuesta de asignación**
- Una tabla markdown: | Persona | Ruta sugerida | Por qué |
- Una nota final recordando que tú solo lo propones y que el manager confirma antes de aplicar.

Usa solo personas y rutas de los datos. No inventes.`;

    const reply = await narrate(mastra, prompt);
    return { reply, resourceIds: [] };
  },
});

export const assignRouteWorkflow = createWorkflow({
  id: "assign-route",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadAssign)
  .then(composeProposal);

assignRouteWorkflow.commit();

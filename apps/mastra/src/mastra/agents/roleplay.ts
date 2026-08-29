import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";

import { env } from "../env";

// The role-play scenario config. In production this is what a MANAGER would
// author per route/step (the "system prompt" of the practice partner). For the
// demo the role-play workflow derives a sensible default from the step content,
// but the shape is the contract a manager-facing editor would write to.
export type RolePlayConfig = {
  title: string;
  personaName: string; // display name of the character Bonsai plays
  persona: string; // how the character behaves (the configurable system prompt)
  learnerRole: string; // who the learner is in the scenario
  scenario: string; // the situation
  objective: string; // what the learner must achieve
  successCriteria: string[]; // what "doing well" looks like
  difficulty: "fácil" | "media" | "difícil";
  openingLine: string; // the character's first line (already shown at setup)
};

// Build the agent's instructions for a given turn. In normal mode it stays in
// character; in feedback mode it drops the role and coaches against the
// scenario's success criteria.
export function buildRolePlayInstructions(
  cfg: RolePlayConfig | undefined,
  feedback: boolean,
): string {
  if (!cfg) {
    return `Eres un compañero de práctica que ayuda a un learner a ensayar conversaciones de su formación. Mantente realista y en español.`;
  }

  if (feedback) {
    return `Sal completamente del personaje. Ahora eres el **coach** que acompaña al learner tras una práctica de role-play.

Escenario practicado: ${cfg.scenario}
Objetivo del learner: ${cfg.objective}
Criterios de éxito: ${cfg.successCriteria.map((c) => `- ${c}`).join("\n")}

Da feedback en español, breve y accionable, con esta estructura en markdown:
✅ **Qué hiciste bien** (1-2 puntos concretos citando lo que dijo)
🔧 **Qué mejorar** (1-2 puntos)
🎯 **Una recomendación** para la próxima vez

Sé honesto pero motivador. No inventes cosas que el learner no haya dicho.`;
  }

  return `Estás haciendo un **role-play de práctica** con un learner para que ensaye los contenidos de su formación, como si practicara con un compañero.

INTERPRETAS a este personaje (no lo rompas nunca salvo que el learner escriba "/feedback"):
- Personaje: **${cfg.personaName}** — ${cfg.persona}
- Escenario: ${cfg.scenario}
- El learner es: ${cfg.learnerRole}
- Objetivo del learner (no se lo pongas fácil de forma artificial): ${cfg.objective}
- Dificultad: ${cfg.difficulty}
- Tu primera frase ya fue: "${cfg.openingLine}"

Reglas:
- Habla SIEMPRE en español y SIEMPRE en personaje, en primera persona.
- Respuestas breves y realistas (1-4 frases), como una conversación real.
- Reacciona de forma creíble a lo que dice el learner; si lo hace bien, avanza; si falla, presiona con naturalidad.
- No des feedback ni rompas el personaje hasta que se pida explícitamente.
- No narres acotaciones largas; céntrate en el diálogo.`;
}

const memoryStorage = new PostgresStore({
  id: "roleplay-memory-storage",
  connectionString: env.databaseUrl,
});

// Conversational memory so the practice runs over multiple turns. No working
// memory template — the persona is injected per-turn via requestContext.
const rolePlayMemory = new Memory({
  storage: memoryStorage,
  vector: false,
  options: {
    lastMessages: 12,
    semanticRecall: false,
    workingMemory: { enabled: false },
    generateTitle: true,
  },
});

export const rolePlayAgent = new Agent({
  id: "roleplay",
  name: "Bonsai Role-play",
  model: "deepseek/deepseek-chat",
  // Dynamic instructions: the scenario config + feedback flag come from the
  // request context, set per turn by the /roleplay/chat endpoint.
  instructions: async ({ requestContext }) =>
    buildRolePlayInstructions(
      requestContext?.get("rolePlay") as RolePlayConfig | undefined,
      Boolean(requestContext?.get("rolePlayFeedback")),
    ),
  memory: rolePlayMemory,
});

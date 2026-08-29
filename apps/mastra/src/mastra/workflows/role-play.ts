import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import type { RolePlayConfig } from "../agents/roleplay";
import { getRouteProgressSnapshot } from "../domain/learning";
import { searchChunks } from "../domain/recommend";

// Button: "Ponte en situación" (learner). Sets up a role-play practice on the
// current content: derives a scenario + the character Bonsai will play, then
// opens with the character's first line. The actual back-and-forth runs over
// POST /roleplay/chat, which keeps Bonsai in character across turns.

const inputSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  topic: z.string().optional(),
});

const rolePlaySchema = z.object({
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

const replySchema = z.object({
  reply: z.string(),
  resourceIds: z.array(z.string()),
  roleplay: rolePlaySchema,
});

const dataSchema = z.object({
  stepTitle: z.string(),
  objective: z.string(),
  chunkText: z.string(),
  resourceIds: z.array(z.string()),
});

const loadScenarioContent = createStep({
  id: "load-scenario-content",
  description: "Resolve the current step + a content snippet to ground the role-play",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const { organizationId, userId, topic } = inputData;
    const snap = await getRouteProgressSnapshot(organizationId, userId);
    const target = snap.currentStep ?? snap.lastCompletedStep ?? snap.steps[0]?.step ?? null;

    const query = topic?.trim() || (target ? `${target.title}. ${target.objective}` : "onboarding");
    let chunkText = "";
    try {
      const chunks = await searchChunks({ organizationId, query, topK: 2 });
      chunkText = chunks.map((c) => c.text).join("\n\n").slice(0, 1200);
    } catch {
      // Embeddings unavailable — fall back to the objective only.
    }

    return {
      stepTitle: target?.title ?? "Tu lección actual",
      objective: target?.objective ?? "",
      chunkText,
      resourceIds: target?.resourceIds ?? [],
    };
  },
});

// Deterministic fallback so the demo never breaks if JSON generation fails.
function fallbackConfig(stepTitle: string, objective: string): RolePlayConfig {
  return {
    title: `Práctica: ${stepTitle}`,
    personaName: "Marisa, compañera de equipo",
    persona:
      "Una compañera con dudas reales sobre el tema; pregunta de forma natural y pide que se lo aclaren con ejemplos.",
    learnerRole: "La persona que acaba de estudiar este contenido y se lo explica a un compañero.",
    scenario: `Marisa te para en la oficina porque no termina de entender "${stepTitle}" y te pide que se lo expliques.`,
    objective: objective || `Explicar con claridad ${stepTitle} y resolver las dudas de tu compañera.`,
    successCriteria: [
      "Explica el concepto con tus propias palabras",
      "Usa un ejemplo concreto",
      "Comprueba que la otra persona lo ha entendido",
    ],
    difficulty: "media",
    openingLine: `Oye, ¿tienes un momento? Me han asignado lo de "${stepTitle}" y no me queda nada claro… ¿me lo explicas?`,
  };
}

const buildScenario = createStep({
  id: "build-scenario",
  description: "Generate the role-play config + opening line, then frame the intro",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const composer = mastra?.getAgent("composerAgent");

    let cfg = fallbackConfig(inputData.stepTitle, inputData.objective);
    if (composer) {
      const prompt = `Diseña un **role-play de práctica** en español para que un learner ensaye este contenido conversando, como con un compañero.

Contenido:
- Lección: ${inputData.stepTitle}
- Objetivo: ${inputData.objective}
- Material de apoyo: ${inputData.chunkText || "(sin extracto; usa el objetivo)"}

Inventa un escenario realista y un personaje que el sistema interpretará (un cliente, un compañero, un auditor, etc.) coherente con el contenido.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto alrededor, sin bloques de código) con EXACTAMENTE estas claves:
{
  "title": string,                // título corto del escenario
  "personaName": string,          // nombre del personaje que interpretará el sistema
  "persona": string,              // cómo se comporta ese personaje (su "system prompt")
  "learnerRole": string,          // quién es el learner en el escenario
  "scenario": string,             // la situación, 1-2 frases
  "objective": string,            // qué debe conseguir el learner
  "successCriteria": string[],    // 3 criterios de éxito
  "difficulty": "fácil" | "media" | "difícil",
  "openingLine": string           // la primera frase del personaje, en personaje
}`;
      try {
        const res = await composer.generate(prompt);
        const raw = (res.text ?? "").trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as Partial<RolePlayConfig>;
          cfg = {
            title: parsed.title || cfg.title,
            personaName: parsed.personaName || cfg.personaName,
            persona: parsed.persona || cfg.persona,
            learnerRole: parsed.learnerRole || cfg.learnerRole,
            scenario: parsed.scenario || cfg.scenario,
            objective: parsed.objective || cfg.objective,
            successCriteria:
              Array.isArray(parsed.successCriteria) && parsed.successCriteria.length
                ? parsed.successCriteria
                : cfg.successCriteria,
            difficulty: (["fácil", "media", "difícil"] as const).includes(parsed.difficulty as never)
              ? (parsed.difficulty as RolePlayConfig["difficulty"])
              : cfg.difficulty,
            openingLine: parsed.openingLine || cfg.openingLine,
          };
        }
      } catch {
        // Keep the fallback config.
      }
    }

    const reply = `🎭 **${cfg.title}**

${cfg.scenario}

- **Tu rol:** ${cfg.learnerRole}
- **Objetivo:** ${cfg.objective}
- **Dificultad:** ${cfg.difficulty}

---

**${cfg.personaName}:** "${cfg.openingLine}"

_Responde abajo para practicar. Cuando quieras cerrar, pulsa **"Terminar y recibir feedback"**._`;

    return { reply, resourceIds: inputData.resourceIds, roleplay: cfg };
  },
});

export const rolePlayWorkflow = createWorkflow({
  id: "role-play",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadScenarioContent)
  .then(buildScenario);

rolePlayWorkflow.commit();

import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { narrate } from "../agents/composer";
import { getRouteProgressSnapshot } from "../domain/learning";
import { searchChunks } from "../domain/recommend";

// Button: "Tengo una duda" (learner). Re-explains the current lesson in plain
// language, grounded in the org's knowledge base with citations. An optional
// `topic` lets a free-text doubt drive the search instead of the current step.

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
  question: z.string(),
  chunks: z.array(z.object({ title: z.string(), text: z.string() })),
  resourceIds: z.array(z.string()),
});

const loadLessonContext = createStep({
  id: "load-lesson-context",
  description: "Resolve the current step + retrieve grounding chunks",
  inputSchema,
  outputSchema: dataSchema,
  execute: async ({ inputData }) => {
    const { organizationId, userId, topic } = inputData;
    const snap = await getRouteProgressSnapshot(organizationId, userId);
    const target = snap.currentStep ?? snap.lastCompletedStep ?? snap.steps[0]?.step ?? null;

    const question =
      topic?.trim() ||
      (target ? `Explícame de forma sencilla: ${target.title}. ${target.objective}` : "onboarding");

    const chunks = await searchChunks({ organizationId, query: question, topK: 4 });

    return {
      stepTitle: target?.title ?? "Tu lección actual",
      objective: target?.objective ?? "",
      question,
      chunks: chunks.map((c) => ({ title: c.title, text: c.text })),
      resourceIds: target?.resourceIds ?? [],
    };
  },
});

const composeExplanation = createStep({
  id: "compose-explanation",
  description: "Re-explain the lesson simply, with citations",
  inputSchema: dataSchema,
  outputSchema: replySchema,
  execute: async ({ inputData, mastra }) => {
    const prompt = `Un learner no entiende bien algo y pide que se lo expliques de otra forma.

Lección: ${inputData.stepTitle}
Objetivo: ${inputData.objective}
Lo que pregunta / duda: ${inputData.question}

Fragmentos de la base de conocimiento de su empresa (úsalos como fuente y cítalos):
${JSON.stringify(inputData.chunks, null, 2)}

Estructura:
💡 **Te lo explico de otra forma**
- Una explicación sencilla, con una analogía cotidiana si ayuda.
- Apóyate en los fragmentos y **cita la fuente** en markdown, ej: "(ver **${inputData.chunks[0]?.title ?? "el documento"}**)".
- Termina con una pregunta breve para comprobar que se ha entendido.

Si los fragmentos no cubren la duda, dilo con honestidad y explica con lo que sabes del objetivo, sin inventar datos concretos.`;

    const reply = await narrate(mastra, prompt);
    return { reply, resourceIds: inputData.resourceIds };
  },
});

export const reexplainLessonWorkflow = createWorkflow({
  id: "reexplain-lesson",
  inputSchema,
  outputSchema: replySchema,
})
  .then(loadLessonContext)
  .then(composeExplanation);

reexplainLessonWorkflow.commit();

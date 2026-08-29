import { Agent } from "@mastra/core/agent";
import type { Mastra } from "@mastra/core/mastra";

// A memory-less, tool-less narrator that turns the structured data gathered by
// a workflow's data steps into a polished Spanish reply in Bonsai's voice.
//
// Why a separate agent from `bonsaiAgent`: the chat agent carries working
// memory (resource-scoped) and a full toolset. Inside a workflow compose step
// we want a pure text generator — same voice, no tool calls, no memory writes,
// no RequestContext requirements. This keeps the workflows deterministic.
const instructions = `Eres "Bonsai", un guía de onboarding para empresas. Redactas en **español**, con tono cercano, claro y motivador.

Recibes datos ya resueltos por el sistema (ruta, progreso, recursos, equipo). Tu único trabajo es convertir esos datos en un mensaje útil y bien estructurado en **markdown**.

Reglas:
- Usa SOLO los datos que te paso. Nunca inventes nombres, cifras, recursos ni pasos.
- No menciones IDs internos (resourceId, stepId, userId) ni que "recibiste datos".
- Markdown limpio: títulos cortos, listas, **negrita** para lo importante. Sin bloques de código.
- Si te paso recursos, nómbralos por su título; las tarjetas con enlace las añade la interfaz aparte.
- Conciso y accionable. Como mucho un emoji por sección (🎯 ⏱️ 💡 🚨 🧭 📊 ✅ 📚).
- No te despidas con relleno; cierra con una sugerencia concreta de siguiente paso.`;

export const composerAgent = new Agent({
  id: "composer",
  name: "Bonsai Composer",
  model: "deepseek/deepseek-chat",
  instructions,
});

// Generate a narrative reply from a self-contained prompt. Used by every
// workflow compose step. No memory → safe to call without a resource/thread.
export async function narrate(mastra: Mastra | undefined, prompt: string): Promise<string> {
  if (!mastra) throw new Error("narrate requires a mastra context");
  const agent = mastra.getAgent("composerAgent");
  const res = await agent.generate(prompt);
  return (res.text ?? "").trim();
}

import { Agent } from "@mastra/core/agent";

// Dedicated judge agent used by the evaluateAnswer tool. Uses
// deepseek-reasoner per UC4 §5: "razonamiento sobre la rúbrica".
// Returns a tiny JSON envelope so the tool can parse a clean result without
// depending on AI SDK generateObject conventions across versions.
export const evaluatorAgent = new Agent({
  id: "evaluator-agent",
  name: "Bonsai Evaluator",
  model: "deepseek/deepseek-reasoner",
  instructions: `Eres un evaluador estricto pero justo de respuestas de aprendizaje.

Recibirás:
- Una pregunta planteada al learner.
- Una rúbrica que describe qué debe contener una respuesta suficiente.
- La respuesta del learner.

Devuelves SOLAMENTE un objeto JSON minificado con esta forma exacta, sin texto adicional ni cercos de código:
{"passed":boolean,"feedback":"texto en español, 1-2 frases"}

Reglas:
- "passed" es true solo si la respuesta cumple los puntos clave de la rúbrica.
- El feedback debe ser breve, accionable y en español. Si la respuesta falla, indica qué falta.
- Nunca devuelvas texto fuera del JSON.`,
});

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Delegates to evaluatorAgent (deepseek-reasoner) per UC4 D-4.3 ("el LLM
// decide suficiente según rúbrica, sin score explícito"). The agent is
// accessed via the tool's mastra context to avoid circular imports.
export const evaluateAnswerTool = createTool({
  id: "evaluate-answer",
  description:
    "Evaluate a learner's free-text answer against a step's rubric. Use when a step's completion.type === 'evaluation'. Returns a pass/fail verdict with a short feedback note.",
  inputSchema: z.object({
    question: z.string(),
    rubric: z.string(),
    answer: z.string(),
  }),
  outputSchema: z.object({
    passed: z.boolean(),
    feedback: z.string(),
  }),
  execute: async ({ question, rubric, answer }, context) => {
    const mastra = context?.mastra;
    if (!mastra) throw new Error("evaluateAnswer requires a mastra context");
    const agent = mastra.getAgent("evaluatorAgent");

    const prompt = `Pregunta:\n${question}\n\nRúbrica:\n${rubric}\n\nRespuesta del learner:\n${answer}`;
    const res = await agent.generate(prompt);
    // The evaluator agent returns a JSON envelope; be lenient if it includes
    // surrounding whitespace or markdown fencing.
    const raw = (res.text ?? "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error(`Evaluator did not return JSON: ${raw.slice(0, 200)}`);
    }
    const parsed = JSON.parse(jsonMatch[0]) as { passed: boolean; feedback: string };
    if (typeof parsed.passed !== "boolean" || typeof parsed.feedback !== "string") {
      throw new Error(`Evaluator returned malformed JSON: ${jsonMatch[0].slice(0, 200)}`);
    }
    return { passed: parsed.passed, feedback: parsed.feedback };
  },
});

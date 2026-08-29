import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { findStep, getRouteForOrg } from "../domain/route";
import { ctxFromTool } from "./_helpers";

export const gradeQuizTool = createTool({
  id: "grade-quiz",
  description:
    "Grade a learner's quiz answers against the route's stored answer key. Use when a step's completion.type === 'quiz' and the learner has provided all answers.",
  inputSchema: z.object({
    routeId: z.string(),
    stepId: z.string(),
    answers: z.array(z.number().int().nonnegative()),
  }),
  outputSchema: z.object({
    passed: z.boolean(),
    score: z.number(),
    correct: z.number(),
    total: z.number(),
    perQuestion: z.array(
      z.object({ index: z.number(), correct: z.boolean(), expected: z.number() }),
    ),
  }),
  execute: async ({ routeId, stepId, answers }, context) => {
    const { organizationId } = ctxFromTool(context?.requestContext);
    const route = await getRouteForOrg(organizationId);
    if (!route || route.id !== routeId) {
      throw new Error(`Route ${routeId} not found for current org`);
    }
    const step = findStep(route, stepId);
    if (!step) throw new Error(`Step ${stepId} not found in route ${routeId}`);
    if (step.completion.type !== "quiz") {
      throw new Error(`Step ${stepId} is not a quiz step`);
    }
    const questions = step.completion.questions;
    if (answers.length !== questions.length) {
      throw new Error(
        `Expected ${questions.length} answers, got ${answers.length}`,
      );
    }
    const perQuestion = questions.map((q, i) => ({
      index: i,
      correct: answers[i] === q.answer,
      expected: q.answer,
    }));
    const correct = perQuestion.filter((r) => r.correct).length;
    const score = questions.length > 0 ? correct / questions.length : 0;
    return {
      passed: score >= step.completion.passScore,
      score,
      correct,
      total: questions.length,
      perQuestion,
    };
  },
});

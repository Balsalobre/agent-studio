import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { recommendResources } from "../domain/recommend";
import { ctxFromTool } from "./_helpers";

// Per UC4 D-4.6: Bonsai can recommend resources OUTSIDE the route from
// the org's catalogue when coherent with the learner's context. Unlike
// ragQueryTool (which returns chunks for citation), this tool returns full
// Resource DTOs ready to be presented with links/descriptions.
export const recommendResourcesTool = createTool({
  id: "recommend-resources",
  description:
    "Recommend resources from the organisation's catalogue that match a learner's interest or query. Returns full resource DTOs (with link, description, tags). Use to suggest complementary material beyond the current route step.",
  inputSchema: z.object({
    query: z.string(),
    topK: z.number().int().positive().max(20).default(6),
  }),
  outputSchema: z.object({
    resources: z.array(
      z.object({
        id: z.string(),
        organizationId: z.string(),
        type: z.string(),
        title: z.string(),
        status: z.string(),
        source: z.record(z.string(), z.unknown()),
        metadata: z.record(z.string(), z.unknown()),
        relevance: z.number().nullable(),
      }),
    ),
  }),
  execute: async ({ query, topK }, context) => {
    const { organizationId } = ctxFromTool(context?.requestContext);
    const resources = await recommendResources({ organizationId, query, topK });
    return { resources };
  },
});

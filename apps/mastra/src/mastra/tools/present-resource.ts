import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { prisma } from "../domain/prisma";
import { toResourceDTO } from "../domain/resources";
import { ctxFromTool } from "./_helpers";

export const presentResourceTool = createTool({
  id: "present-resource",
  description:
    "Fetch details of a single resource in the learner's organisation by id. Returns title, type, status, link/source, and metadata so Bonsai can present it with a markdown link.",
  inputSchema: z.object({
    resourceId: z.string(),
  }),
  outputSchema: z.object({
    resource: z
      .object({
        id: z.string(),
        organizationId: z.string(),
        type: z.string(),
        title: z.string(),
        status: z.string(),
        source: z.record(z.string(), z.unknown()),
        metadata: z.record(z.string(), z.unknown()),
      })
      .nullable(),
  }),
  execute: async ({ resourceId }, context) => {
    const { organizationId } = ctxFromTool(context?.requestContext);
    const row = await prisma.resource.findFirst({
      where: { id: resourceId, organizationId },
    });
    return { resource: row ? toResourceDTO(row) : null };
  },
});

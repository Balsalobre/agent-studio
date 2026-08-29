import { createStep, createWorkflow } from "@mastra/core/workflows";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { z } from "zod";

import { prisma } from "../domain/prisma";
import { buildIndexableText } from "../domain/resources";
import {
  ensureResourceIndex,
  pgVector,
  RESOURCE_EMBEDDING_MODEL,
  RESOURCE_INDEX_NAME,
} from "../domain/vector";

const inputSchema = z.object({
  resourceId: z.string(),
  organizationId: z.string(),
});

const outputSchema = z.object({
  resourceId: z.string(),
  chunks: z.number(),
  status: z.enum(["indexed", "error"]),
});

const embeddingModel = new ModelRouterEmbeddingModel(RESOURCE_EMBEDDING_MODEL);

// Standalone indexing routine shared by the workflow step and the seed script.
// Idempotent (upsert by chunk id is not used; the seed deletes prior org
// vectors before re-running to avoid duplicates).
export async function runIndexResource({
  resourceId,
  organizationId,
}: {
  resourceId: string;
  organizationId: string;
}): Promise<{ resourceId: string; chunks: number; status: "indexed" }> {
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, organizationId },
  });
  if (!resource) {
    throw new Error(`Resource ${resourceId} not found in org ${organizationId}`);
  }

  try {
    await prisma.resource.update({
      where: { id: resourceId },
      data: { status: "indexing" },
    });

    const text = buildIndexableText(resource);
    if (!text.trim()) {
      throw new Error(`Resource ${resourceId} has no indexable text`);
    }

    const doc = MDocument.fromText(text);
    const chunks = await doc.chunk({
      strategy: "recursive",
      maxSize: 512,
      overlap: 50,
    });
    if (chunks.length === 0) {
      throw new Error(`Chunking produced 0 chunks for resource ${resourceId}`);
    }

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks.map((c) => c.text),
    });

    await ensureResourceIndex();
    const metadata = chunks.map((c) => ({
      organizationId,
      resourceId,
      resourceType: resource.type,
      title: resource.title,
      text: c.text,
    }));
    await pgVector.upsert({
      indexName: RESOURCE_INDEX_NAME,
      vectors: embeddings,
      metadata,
    });

    await prisma.resource.update({
      where: { id: resourceId },
      data: { status: "indexed" },
    });

    return { resourceId, chunks: chunks.length, status: "indexed" };
  } catch (err) {
    await prisma.resource.update({
      where: { id: resourceId },
      data: { status: "error" },
    });
    throw err;
  }
}

const indexResource = createStep({
  id: "index-resource",
  description: "Chunk → embed → upsert a resource into the pgvector index",
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => runIndexResource(inputData),
});

export const indexResourceWorkflow = createWorkflow({
  id: "index-resource",
  inputSchema,
  outputSchema,
}).then(indexResource);

indexResourceWorkflow.commit();

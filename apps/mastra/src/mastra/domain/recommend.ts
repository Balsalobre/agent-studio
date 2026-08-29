import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { embedMany } from "ai";

import { prisma } from "./prisma";
import { toResourceDTO } from "./resources";
import type { ResourceDTO } from "./types";
import {
  pgVector,
  RESOURCE_EMBEDDING_MODEL,
  RESOURCE_INDEX_NAME,
} from "./vector";

const embeddingModel = new ModelRouterEmbeddingModel(RESOURCE_EMBEDDING_MODEL);

export type RecommendedResource = ResourceDTO & { relevance: number | null };

// Embed a query and return the best resources for an org, deduped by resourceId
// and sorted by relevance. Shared by the recommend-resources tool and the
// weekly-goal workflow so both rank catalogue material the same way.
export async function recommendResources({
  organizationId,
  query,
  topK = 6,
}: {
  organizationId: string;
  query: string;
  topK?: number;
}): Promise<RecommendedResource[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: [query],
  });
  const queryVector = embeddings[0]!;

  const hits = await pgVector.query({
    indexName: RESOURCE_INDEX_NAME,
    queryVector,
    topK,
    filter: { organizationId: { $eq: organizationId } },
  });

  const bestById = new Map<string, number>();
  for (const h of hits) {
    const id = (h.metadata as { resourceId?: string }).resourceId;
    if (!id) continue;
    if (!bestById.has(id) || (bestById.get(id) ?? -1) < h.score) {
      bestById.set(id, h.score);
    }
  }
  if (bestById.size === 0) return [];

  const rows = await prisma.resource.findMany({
    where: { organizationId, id: { in: [...bestById.keys()] } },
  });
  return rows
    .map((r) => ({ ...toResourceDTO(r), relevance: bestById.get(r.id) ?? null }))
    .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));
}

export type GroundingChunk = { title: string; text: string; relevance: number };

// Return raw text chunks (not whole resources) for grounding an explanation
// with citations. Used by the reexplain-lesson workflow. Mirrors what the
// rag-query tool surfaces to the agent, but callable directly from a step.
export async function searchChunks({
  organizationId,
  query,
  topK = 4,
}: {
  organizationId: string;
  query: string;
  topK?: number;
}): Promise<GroundingChunk[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: [query],
  });
  const queryVector = embeddings[0]!;

  const hits = await pgVector.query({
    indexName: RESOURCE_INDEX_NAME,
    queryVector,
    topK,
    filter: { organizationId: { $eq: organizationId } },
  });

  return hits
    .map((h) => {
      const m = h.metadata as { title?: string; text?: string };
      return { title: m.title ?? "Documento", text: m.text ?? "", relevance: h.score };
    })
    .filter((c) => c.text.trim().length > 0);
}

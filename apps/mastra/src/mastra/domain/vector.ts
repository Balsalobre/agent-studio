import { PgVector } from "@mastra/pg";
import { env } from "../env";

export const VECTOR_STORE_NAME = "pgVector" as const;
export const RESOURCE_INDEX_NAME = "resource_chunks" as const;
// Centralised here so swapping models is a one-touch change. Keep the
// dimension paired with the model — getting them out of sync makes
// PgVector.createIndex silently rebuild, which can drop existing vectors.
export const RESOURCE_EMBEDDING_MODEL = "openai/text-embedding-3-large" as const;
export const RESOURCE_EMBEDDING_DIMENSION = 3072 as const;

export const pgVector = new PgVector({
  id: "bonsai-pg-vector",
  connectionString: env.databaseUrl,
});

let ensured = false;

// Ensures the resource_chunks index exists. Idempotent per @mastra/pg
// (same config -> no-op). Cached after the first successful call.
//
// We use `flat` (sequential scan) instead of the default `ivfflat` because
// pgvector's ivfflat and hnsw indexes cap at 2000 dimensions, while
// openai/text-embedding-3-large emits 3072. At this catalogue size
// (hundreds of chunks per org) flat is plenty fast and avoids the
// dimensionality limit entirely.
export async function ensureResourceIndex(): Promise<void> {
  if (ensured) return;
  await pgVector.createIndex({
    indexName: RESOURCE_INDEX_NAME,
    dimension: RESOURCE_EMBEDDING_DIMENSION,
    metric: "cosine",
    indexConfig: { type: "flat" },
  });
  ensured = true;
}

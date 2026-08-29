import { createVectorQueryTool } from "@mastra/rag";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import type { RequestContext } from "@mastra/core/request-context";

import {
  RESOURCE_EMBEDDING_MODEL,
  RESOURCE_INDEX_NAME,
  VECTOR_STORE_NAME,
} from "../domain/vector";

// Default topK per UC3 D-3.3.
export const RAG_DEFAULT_TOP_K = 4;

// The RAG tool the Bonsai agent uses to retrieve context.
//
// enableFilter is intentionally NOT set: this hides the `filter` arg from
// the LLM so it cannot influence org isolation. The server forces the org
// filter via requestContext.set('filter', ...) for every chat request.
// See docs-server-request-context.md / reference-rag-metadata-filters.md.
export const ragQueryTool = createVectorQueryTool({
  id: "rag-query-tool",
  description:
    "Search the organisation's knowledge base (PDFs, learning experiences, mocks) and return relevant chunks with their source metadata for citations.",
  vectorStoreName: VECTOR_STORE_NAME,
  indexName: RESOURCE_INDEX_NAME,
  model: new ModelRouterEmbeddingModel(RESOURCE_EMBEDDING_MODEL),
});

// Apply the per-request org filter + topK to a RequestContext. Call this in
// every handler/agent invocation that runs the Bonsai agent so the RAG tool
// is always scoped to the caller's organisation (UC3 RF-3.4, D-3.1).
export function applyRagContext(
  requestContext: RequestContext,
  organizationId: string,
  topK: number = RAG_DEFAULT_TOP_K,
): void {
  requestContext.set("filter", { organizationId: { $eq: organizationId } });
  requestContext.set("topK", topK);
}

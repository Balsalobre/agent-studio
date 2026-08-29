import type { Resource as PrismaResource } from "@prisma/client";
import type { ResourceDTO, ResourceMetadata, ResourceSource } from "./types";

// Convert a Prisma Resource row to the DTO sent over the API (DOC 06 §3).
export function toResourceDTO(row: PrismaResource): ResourceDTO {
  return {
    id: row.id,
    organizationId: row.organizationId,
    type: row.type,
    title: row.title,
    status: row.status,
    source: (row.source ?? {}) as ResourceSource,
    metadata: (row.metadata ?? {}) as ResourceMetadata,
  };
}

// Build the indexable text for a resource (UC3 §4 step 2).
// PDF: full extracted text. LE / mocks: title + description + metadata.
export function buildIndexableText(row: PrismaResource): string {
  if (row.type === "pdf" && row.extractedText) {
    return row.extractedText;
  }
  const meta = (row.metadata ?? {}) as ResourceMetadata;
  const parts: string[] = [row.title];
  if (meta.description) parts.push(meta.description);
  if (meta.author) parts.push(`Author: ${meta.author}`);
  if (meta.tags?.length) parts.push(`Tags: ${meta.tags.join(", ")}`);
  if (meta.level) parts.push(`Level: ${meta.level}`);
  if (meta.language) parts.push(`Language: ${meta.language}`);
  if (typeof meta.pages === "number") parts.push(`Pages: ${meta.pages}`);
  if (typeof meta.durationSec === "number") parts.push(`Duration (s): ${meta.durationSec}`);
  return parts.join("\n");
}

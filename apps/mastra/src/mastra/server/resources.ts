import { registerApiRoute } from "@mastra/core/server";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";

import { prisma } from "../domain/prisma";
import { toResourceDTO } from "../domain/resources";
import { runIndexResource } from "../workflows/index-resource";
import { ctxFrom, requireAuth, requireRole } from "./auth";

const httpError = (
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND",
  message: string,
) => ({ error: { code, message } });

// POST /resources/pdf — multipart upload. Parses with unpdf in-memory, stores
// text + page count, then indexes.
export const uploadPdfRoute = registerApiRoute("/resources/pdf", {
  method: "POST",
  middleware: [requireAuth(), requireRole("manager")],
  handler: async (c) => {
    const { organizationId } = ctxFrom(c);

    const form = await c.req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof File)) {
      return c.json(httpError("BAD_REQUEST", "multipart field 'file' is required"), 400);
    }
    if (file.size === 0) {
      return c.json(httpError("BAD_REQUEST", "file is empty"), 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    let totalPages: number;
    let text: string;
    try {
      const pdf = await getDocumentProxy(buffer);
      const extracted = await extractText(pdf, { mergePages: true });
      totalPages = extracted.totalPages;
      text = extracted.text;
    } catch (err) {
      return c.json(
        httpError("BAD_REQUEST", `Could not parse PDF: ${(err as Error).message}`),
        400,
      );
    }

    const title = file.name?.replace(/\.pdf$/i, "") || "Untitled PDF";
    const resource = await prisma.resource.create({
      data: {
        organizationId,
        type: "pdf",
        title,
        status: "indexing",
        source: { filename: file.name ?? null },
        metadata: { pages: totalPages },
        extractedText: text,
      },
    });

    try {
      await runIndexResource({
        resourceId: resource.id,
        organizationId,
      });
    } catch (err) {
      // Workflow already marked status=error. Return the row with that status.
      const errored = await prisma.resource.findUniqueOrThrow({ where: { id: resource.id } });
      return c.json({ resource: toResourceDTO(errored), warning: (err as Error).message }, 201);
    }

    const indexed = await prisma.resource.findUniqueOrThrow({ where: { id: resource.id } });
    return c.json({ resource: toResourceDTO(indexed) }, 201);
  },
});

const learningExperienceBody = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  metadata: z
    .object({
      description: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      level: z.enum(["intro", "intermedio", "avanzado"]).optional(),
      language: z.string().optional(),
      durationSec: z.number().int().nonnegative().optional(),
    })
    .partial()
    .optional(),
});

// POST /resources/learning-experience — register an external LE by URL.
// Text indexed = title + description + metadata (D-3.4).
export const registerLeRoute = registerApiRoute("/resources/learning-experience", {
  method: "POST",
  middleware: [requireAuth(), requireRole("manager")],
  handler: async (c) => {
    const { organizationId } = ctxFrom(c);

    const raw = await c.req.json().catch(() => null);
    const parsed = learningExperienceBody.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        httpError("BAD_REQUEST", "Body must be { title, url, metadata? }"),
        400,
      );
    }

    const resource = await prisma.resource.create({
      data: {
        organizationId,
        type: "learning_experience",
        title: parsed.data.title,
        status: "indexing",
        source: { provider: "external", url: parsed.data.url },
        metadata: parsed.data.metadata ?? {},
      },
    });

    try {
      await runIndexResource({
        resourceId: resource.id,
        organizationId,
      });
    } catch (err) {
      const errored = await prisma.resource.findUniqueOrThrow({ where: { id: resource.id } });
      return c.json({ resource: toResourceDTO(errored), warning: (err as Error).message }, 201);
    }

    const indexed = await prisma.resource.findUniqueOrThrow({ where: { id: resource.id } });
    return c.json({ resource: toResourceDTO(indexed) }, 201);
  },
});

// GET /resources — list the org's catalogue (manager only per UC2 §2 Out).
export const listResourcesRoute = registerApiRoute("/resources", {
  method: "GET",
  middleware: [requireAuth(), requireRole("manager")],
  handler: async (c) => {
    const { organizationId } = ctxFrom(c);
    const rows = await prisma.resource.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
    return c.json({ resources: rows.map(toResourceDTO) });
  },
});

export const resourceRoutes = [uploadPdfRoute, registerLeRoute, listResourcesRoute];

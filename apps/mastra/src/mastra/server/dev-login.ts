import { registerApiRoute } from "@mastra/core/server";
import { z } from "zod";
import { prisma } from "../domain/prisma";
import { domainRoleToToken } from "../domain/types";
import { signDevToken } from "./auth";

const bodySchema = z.object({
  email: z.string().email(),
});

// POST /dev/login — dev-only login endpoint (per DOC 06 §1).
// Body: { email }. Looks up the seeded user, signs a JWT, returns user + token.
// Marked requiresAuth: false so anonymous callers can obtain a token.
export const devLoginRoute = registerApiRoute("/dev/login", {
  method: "POST",
  requiresAuth: false,
  handler: async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: { code: "BAD_REQUEST", message: "Body must be { email: string }" } },
        400,
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: parsed.data.email },
      select: { id: true, name: true, role: true, organizationId: true },
    });
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Unknown email" } },
        401,
      );
    }

    const token = await signDevToken({
      sub: user.id,
      organizationId: user.organizationId,
      role: domainRoleToToken(user.role),
    });

    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  },
});

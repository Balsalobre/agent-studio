import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import type { MiddlewareHandler } from "hono";
import { SignJWT } from "jose";
import { env } from "../env";
import type { JwtClaims, RequestCtx, Role } from "../domain/types";
import { tokenRoleToDomain } from "../domain/types";

const secretBytes = new TextEncoder().encode(env.jwtSecret);

// Sign a dev token. Used by POST /dev/login.
export async function signDevToken(claims: Omit<JwtClaims, "iat" | "exp">, ttlSeconds = 60 * 60 * 24 * 7): Promise<string> {
  return await new SignJWT({
    organizationId: claims.organizationId,
    role: claims.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretBytes);
}

// Default demo identity used when a request arrives without a token. The app's
// normal flow always sends one (minted by /dev/login), so this only covers
// direct/anonymous API hits — they resolve to a learner in the seeded org.
const DEFAULT_ORG_ID = process.env.DEMO_ORG_ID || "acme-org";
const DEFAULT_USER_ID = process.env.DEMO_USER_ID || "demo-user";
const DEFAULT_ROLE: Role = "learner";

// Decode a JWT payload WITHOUT verifying the signature or expiry. Security is
// intentionally OFF (demo) — we only read the claims to keep per-user data
// scoping working; we never reject.
function decodeJwtUnverified(token: string): Partial<JwtClaims> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Partial<JwtClaims>;
  } catch {
    return null;
  }
}

// Per-route middleware. SECURITY DISABLED (demo): never rejects. It reads the
// token's claims if present (no signature/expiry check) purely to scope data
// to the right user, and falls back to a default identity otherwise. So an
// expired, wrong-secret, or missing token all still work.
export const requireAuth = (): MiddlewareHandler => async (c, next) => {
  const header = c.req.header("Authorization");
  const token = (header || "").replace(/^Bearer\s+/i, "");
  const claims = token ? decodeJwtUnverified(token) : null;

  const userId = claims?.sub || DEFAULT_USER_ID;
  const organizationId = claims?.organizationId || DEFAULT_ORG_ID;
  const role: Role = claims?.role ? tokenRoleToDomain(claims.role) : DEFAULT_ROLE;

  const ctx = c.get("requestContext");
  ctx.set("userId", userId);
  ctx.set("organizationId", organizationId);
  ctx.set("role", role);
  ctx.set(MASTRA_RESOURCE_ID_KEY, `org:${organizationId}:user:${userId}`);
  await next();
};

// SECURITY DISABLED (demo): role checks are no-ops. Kept as middleware so the
// route definitions in resources/learner/roleplay don't have to change.
export const requireRole = (_role: Role): MiddlewareHandler => async (_c, next) => {
  await next();
};

// Extract typed RequestCtx from a Hono context inside a handler.
// Throws if requireAuth() wasn't applied first (programmer error).
export function ctxFrom(c: { get: (k: "requestContext") => { get: (k: string) => unknown } }): RequestCtx {
  const rc = c.get("requestContext");
  const userId = rc.get("userId") as string | undefined;
  const organizationId = rc.get("organizationId") as string | undefined;
  const role = rc.get("role") as Role | undefined;
  if (!userId || !organizationId || !role) {
    throw new Error("ctxFrom called without requireAuth() middleware");
  }
  return { userId, organizationId, role };
}

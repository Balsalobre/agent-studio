// Smoke test: confirm a jose-signed JWT verifies through MastraJwtAuth.
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(import.meta.dir, "..", ".env") });

const { signDevToken, mastraJwtAuth } = await import("../src/mastra/server/auth");

const token = await signDevToken({
  sub: "user-test",
  organizationId: "org-test",
  role: "admin",
});

console.log("token (first 30):", token.slice(0, 30) + "...");

const claims = await mastraJwtAuth.authenticateToken(token);
console.log("verified claims:", JSON.stringify(claims, null, 2));

const badToken = token.slice(0, -5) + "XXXXX";
try {
  await mastraJwtAuth.authenticateToken(badToken);
  console.error("FAIL: bad token should have thrown");
  process.exit(1);
} catch (err) {
  console.log("bad token rejected as expected:", (err as Error).message);
}

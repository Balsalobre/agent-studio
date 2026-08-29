// One-off bootstrap: enable pgvector. Idempotent.
// Run with: bun run apps/mastra/scripts/db-bootstrap.ts
import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dir, "..", ".env") });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query("CREATE EXTENSION IF NOT EXISTS vector");
  const r = await client.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'");
  console.log("pgvector:", r.rows[0] ?? "not found");
} finally {
  await client.end();
}

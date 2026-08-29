// List all tables and enums in the public schema. One-off helper.
import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dir, "..", ".env") });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!;
const client = new pg.Client({ connectionString: url });
await client.connect();
const tables = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
);
console.log("Tables:");
for (const r of tables.rows) console.log("  -", r.table_name);

const enums = await client.query(
  "SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typtype='e' AND n.nspname='public' ORDER BY t.typname",
);
console.log("Enums:");
for (const r of enums.rows) console.log("  -", r.typname);

await client.end();

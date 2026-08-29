/**
 * Playwright globalSetup — runs once before the entire suite.
 *
 * Wipes the seeded learner's progress so specs that depend on a clean
 * state (e.g. open-resource auto-completing step-1) start from zero.
 * Loads the shared .env from apps/mastra so we don't duplicate secrets.
 */
import { Client } from 'pg';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

export default async function globalSetup(): Promise<void> {
  loadDotenv({ path: resolve(__dirname, '..', 'mastra', '.env'), quiet: true });
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('e2e globalSetup: DATABASE_URL (or _UNPOOLED) is not set; cannot reset learner state');
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const r = await client.query(
      `DELETE FROM learner_progress WHERE user_id = $1`,
      ['acme-learner'],
    );
    // eslint-disable-next-line no-console
    console.log(`[e2e setup] cleared ${r.rowCount} learner_progress row(s) for acme-learner`);
  } finally {
    await client.end();
  }
}

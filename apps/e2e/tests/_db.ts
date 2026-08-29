/**
 * DB helpers used by specs that need to set up state directly (faster and
 * more reliable than driving the UI through prerequisite flows).
 *
 * Connects to the same Postgres the live mastra dev server is using via the
 * shared .env in apps/mastra.
 */
import { Client } from 'pg';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

let envLoaded = false;
function ensureEnv() {
  if (envLoaded) return;
  loadDotenv({ path: resolve(__dirname, '..', '..', 'mastra', '.env'), quiet: true });
  envLoaded = true;
}

function dbUrl(): string {
  ensureEnv();
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('e2e _db: DATABASE_URL is not set');
  return url;
}

async function withClient<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export const ROUTE_ID = 'route-acme-default';
export const LEARNER_ID = 'acme-learner';
export const ORG_ID = 'acme-org';

/**
 * Step ids of the seeded banking route (seed-bonsai.ts → seed/routes/acme-org.json).
 * Ids derive from the node code: "COMP-01.1" → "step-comp-01-1". Completion
 * type is annotated so specs pick the right kind of step to drive.
 */
export const STEPS = {
  certificacionCompliance: 'step-comp-01', //   1 · consume   (Nodo Certificación)
  prevencionFraude: 'step-comp-01-1', //         2 · quiz      (Prevención de Fraude)
  proteccionDatos: 'step-comp-01-2', //          3 · consume   (Protección de Datos)
  codigoConducta: 'step-comp-01-3', //           4 · evaluation
  ecosistemaDigital: 'step-tool-01', //          5 · consume   (Nodo Herramientas)
  crmFinanciero: 'step-tool-01-1', //            6 · consume
  asistenteRag: 'step-tool-01-2', //             7 · consume
  evaluacionRiesgos: 'step-tool-01-3', //        8 · quiz
  academiaExcelencia: 'step-cap-01', //          9 · consume   (Nodo Cultura)
  proyectosAgiles: 'step-cap-01-1', //          10 · consume
  finanzasBasicas: 'step-cap-01-2', //          11 · quiz
  bibliotecaDigital: 'step-cap-01-3', //        12 · consume
  liderazgoInclusion: 'step-cap-01-4', //       13 · evaluation
} as const;

/** Wipe all progress rows for the seeded learner. Used by specs that need a
 *  guaranteed clean slate beyond the global setup. */
export async function clearLearnerProgress(): Promise<void> {
  await withClient((c) =>
    c.query(`DELETE FROM learner_progress WHERE user_id = $1`, [LEARNER_ID]),
  );
}

/** Mark a single route step as completed for the seeded learner. */
export async function markStepCompleted(
  stepId: string,
  evidence: Record<string, unknown> = { via: 'e2e-setup' },
): Promise<void> {
  await withClient((c) =>
    c.query(
      `INSERT INTO learner_progress (id, organization_id, user_id, route_id, step_id, status, evidence, completed_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'completed'::"ProgressStatus", $5::jsonb, NOW(), NOW())
       ON CONFLICT (user_id, route_id, step_id)
       DO UPDATE SET status = 'completed'::"ProgressStatus", evidence = EXCLUDED.evidence, completed_at = NOW(), updated_at = NOW()`,
      [ORG_ID, LEARNER_ID, ROUTE_ID, stepId, JSON.stringify(evidence)],
    ),
  );
}

/** Delete any resource rows the manager-upload spec creates so the catalogue
 *  doesn't accumulate test garbage across runs. Matches by title prefix. */
export async function deleteResourcesWithTitlePrefix(prefix: string): Promise<number> {
  return withClient(async (c) => {
    const res = await c.query(
      `DELETE FROM resources WHERE organization_id = $1 AND title LIKE $2`,
      [ORG_ID, `${prefix}%`],
    );
    return res.rowCount ?? 0;
  });
}

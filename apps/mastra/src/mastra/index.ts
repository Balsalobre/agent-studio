import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";

import { testRoutes } from "./test-endpoint";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { indexResourceWorkflow } from "./workflows/index-resource";
import { weeklyGoalWorkflow } from "./workflows/weekly-goal";
import { quickReviewWorkflow } from "./workflows/quick-review";
import { reexplainLessonWorkflow } from "./workflows/reexplain-lesson";
import { teamAtRiskWorkflow } from "./workflows/team-at-risk";
import { assignRouteWorkflow } from "./workflows/assign-route";
import { teamDigestWorkflow } from "./workflows/team-digest";
import { rolePlayWorkflow } from "./workflows/role-play";
import { weatherAgent } from "./agents/weather-agent";
import { bonsaiAgent } from "./agents/bonsai";
import { composerAgent } from "./agents/composer";
import { rolePlayAgent } from "./agents/roleplay";
import { evaluatorAgent } from "./agents/evaluator";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";

import { env } from "./env";
import { devLoginRoute } from "./server/dev-login";
import { resourceRoutes } from "./server/resources";
import { learnerRoutes } from "./server/learner";
import { workflowRoutes } from "./server/workflows";
import { rolePlayRoutes } from "./server/roleplay";
import { staticRoutes } from "./server/static";
import { pgVector, VECTOR_STORE_NAME } from "./domain/vector";

const storage = new PostgresStore({
  id: "pg-storage",
  connectionString: env.databaseUrl,
});

export const mastra = new Mastra({
  // No deployer registered → `mastra build` produces a plain Node runnable
  // (.mastra/output/index.mjs) that `mastra start` runs with PORT env. Works
  // on any container host (Railway / Fly / Render). Re-add VercelDeployer if
  // we ever target Vercel functions again.
  bundler: {
    // `unpdf` (PDF text extraction in POST /resources/pdf) lazily imports its
    // PDF.js bundle via a runtime path (unpdf/dist/pdfjs.mjs) that static
    // analysis can't see, so it gets dropped from the bundle and PDF upload
    // fails with ERR_MODULE_NOT_FOUND. dynamicPackages keeps unpdf intact in
    // the output's node_modules. Declaring any bundler config disables the
    // implicit @prisma externalization, so we restore it explicitly here
    // (pg / @libsql are auto-merged with the global externals).
    externals: ["@prisma", "@prisma/client"],
    dynamicPackages: ["unpdf"],
  },
  server: {
    // SECURITY DISABLED (demo): no global JWT verifier. The Studio's built-in
    // routes are wide open, and the bonsai app routes use a permissive
    // requireAuth() that never rejects (see server/auth.ts). Re-register a
    // verifier here to lock things back down.
    auth: undefined,
    // Permissive CORS for the demo; bonsai uses Bearer tokens, not cookies,
    // so credentials aren't required.
    cors: {
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    },
    apiRoutes: [devLoginRoute, ...resourceRoutes, ...learnerRoutes, ...workflowRoutes, ...rolePlayRoutes, ...testRoutes, ...staticRoutes],
  },
  vectors: { [VECTOR_STORE_NAME]: pgVector },
  workflows: {
    weatherWorkflow,
    indexResourceWorkflow,
    weeklyGoalWorkflow,
    quickReviewWorkflow,
    reexplainLessonWorkflow,
    teamAtRiskWorkflow,
    assignRouteWorkflow,
    teamDigestWorkflow,
    rolePlayWorkflow,
  },
  agents: { weatherAgent, bonsaiAgent, composerAgent, rolePlayAgent, evaluatorAgent },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,
    translationScorer,
  },
  storage,
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new MastraStorageExporter(),
          new MastraPlatformExporter(),
        ],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});

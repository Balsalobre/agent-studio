import { Mastra } from "@mastra/core/mastra";
import { SimpleAuth } from '@mastra/core/server'
import { VercelDeployer } from "@mastra/deployer-vercel";
import { PinoLogger } from "@mastra/loggers";
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { testRoutes } from "./test-endpoint";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";

import { PostgresStore } from "@mastra/pg";
import { env } from "./env";

const storage = new PostgresStore({
  id: "pg-storage",
  connectionString: env.databaseUrl,
});

type User = {
  id: string;
  name: string;
  role: "admin" | "user";
};

export const mastra = new Mastra({
  deployer: new VercelDeployer(),
  server: {
    auth: new SimpleAuth<User>({
      tokens: {
        [env.adminApiToken]: { id: "user-1", name: "Admin User", role: "admin" },
        [env.userApiToken]: { id: "user-2", name: "Regular User", role: "user" },
      },
    }),
    apiRoutes: testRoutes,
  },
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
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
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter(), // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});

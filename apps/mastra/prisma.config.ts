import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Postgres database is shared with Mastra's PostgresStore (memory,
// workflows, observability, etc.). Those `mastra_*` tables are owned by
// Mastra and must not be managed/dropped by Prisma migrations.
const mastraExternalTables = [
  "public.mastra_agent_versions",
  "public.mastra_agents",
  "public.mastra_ai_spans",
  "public.mastra_background_tasks",
  "public.mastra_channel_config",
  "public.mastra_channel_installations",
  "public.mastra_dataset_items",
  "public.mastra_dataset_versions",
  "public.mastra_datasets",
  "public.mastra_experiment_results",
  "public.mastra_experiments",
  "public.mastra_favorites",
  "public.mastra_mcp_client_versions",
  "public.mastra_mcp_clients",
  "public.mastra_mcp_server_versions",
  "public.mastra_mcp_servers",
  "public.mastra_messages",
  "public.mastra_observational_memory",
  "public.mastra_prompt_block_versions",
  "public.mastra_prompt_blocks",
  "public.mastra_resources",
  "public.mastra_schedule_triggers",
  "public.mastra_schedules",
  "public.mastra_scorer_definition_versions",
  "public.mastra_scorer_definitions",
  "public.mastra_scorers",
  "public.mastra_skill_blobs",
  "public.mastra_skill_versions",
  "public.mastra_skills",
  "public.mastra_threads",
  "public.mastra_workflow_snapshot",
  "public.mastra_workspace_versions",
  "public.mastra_workspaces",
];

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
  migrations: {
    path: "./prisma/migrations",
  },
  experimental: {
    externalTables: true,
  },
  tables: {
    external: mastraExternalTables,
  },
});

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Load `mastra` skill

**BEFORE doing ANYTHING with Mastra, load the `mastra` skill FIRST.** Mastra APIs change frequently between versions — always read up-to-date docs from `node_modules` rather than relying on cached knowledge.

## Monorepo structure

```
apps/
  mastra/      # Mastra backend server
  studio-spa/  # Mastra Studio static SPA
```

## Commands

Run all commands from `apps/mastra/`:

```bash
cd apps/mastra
npm run dev    # Start Mastra Studio at localhost:4111 (long-running, use a separate terminal)
npm run build  # Build a production server
npm run start  # Start the built server
```

Run `npm run build` to verify TypeScript compiles after any change.

To build the Studio SPA, run from `apps/studio-spa/`:

```bash
cd apps/studio-spa
bun run build  # Outputs static assets to apps/studio-spa/dist/
```

## Architecture

The central configuration is `apps/mastra/src/mastra/index.ts` — all agents, workflows, and scorers must be registered there to be available at runtime.

**Storage is composite**: LibSQL (`mastra.db`) is the primary store for agent memory and workflow state; DuckDB (`mastra.duckdb`) is used exclusively for observability data. Both database files live in `apps/mastra/src/mastra/public/` and are excluded from git.

**AI model**: DeepSeek (`deepseek-chat`) via `@ai-sdk/deepseek`. The only required env var is `DEEPSEEK_API_KEY` (copy `apps/mastra/.env.example` to `apps/mastra/.env`).

**Weather data**: Open-Meteo APIs (no API key needed). The geocoding API resolves city names, and the forecast API returns current conditions and hourly data.

**Scorers are registered twice**: once on the agent definition (in `agents/`) and again in the `Mastra` constructor in `index.ts`. Both registrations are required for evaluations to appear in the Studio.

**Workflow pattern**: `weatherWorkflow` chains two steps — `fetchWeather` calls the Open-Meteo API directly, then `planActivities` calls `weatherAgent.stream()` with a structured prompt. Steps share state via the workflow's context object.

## Project Structure

| Path | Purpose |
|------|---------|
| `apps/mastra/src/mastra/index.ts` | Central Mastra config — register all agents, workflows, scorers here |
| `apps/mastra/src/mastra/agents/` | Agent definitions: model, tools, memory, instructions, scorers |
| `apps/mastra/src/mastra/tools/` | Reusable tools with Zod-validated input/output schemas |
| `apps/mastra/src/mastra/workflows/` | Multi-step orchestration using `createWorkflow` / `createStep` |
| `apps/mastra/src/mastra/scorers/` | Evaluation scorers (prebuilt or custom LLM-as-judge) |
| `apps/mastra/src/mastra/public/` | Copied into build output as-is; contains auto-generated DB files |
| `apps/studio-spa/vite.config.js` | Vite config that copies Studio assets and substitutes env vars |
| `.agents/skills/mastra/` | Downloaded Mastra skill docs — do not edit manually |
| `apps/mastra/.mastra/` | Build artifacts — do not edit manually |

## Boundaries

- Register new agents, tools, workflows, and scorers in `apps/mastra/src/mastra/index.ts`
- Use Zod schemas for all tool inputs and outputs
- Never modify files in `apps/mastra/.mastra/`, `apps/mastra/src/mastra/public/*.db*`, or `node_modules`
- Never hardcode API keys — always use environment variables

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Mastra skill discovery](https://mastra.ai/.well-known/skills/index.json)

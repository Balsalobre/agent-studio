# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Load `mastra` skill

**BEFORE doing ANYTHING with Mastra, load the `mastra` skill FIRST.** Mastra APIs change frequently between versions — always read up-to-date docs from `node_modules` rather than relying on cached knowledge.

## Commands

```bash
npm run dev    # Start Mastra Studio at localhost:4111 (long-running, use a separate terminal)
npm run build  # Build a production server
npm run start  # Start the built server
```

Run `npm run build` to verify TypeScript compiles after any change.

## Architecture

The central configuration is `src/mastra/index.ts` — all agents, workflows, and scorers must be registered there to be available at runtime.

**Storage is composite**: LibSQL (`mastra.db`) is the primary store for agent memory and workflow state; DuckDB (`mastra.duckdb`) is used exclusively for observability data. Both database files live in `src/mastra/public/` and are excluded from git.

**AI model**: DeepSeek (`deepseek-chat`) via `@ai-sdk/deepseek`. The only required env var is `DEEPSEEK_API_KEY` (copy `.env.example` to `.env`).

**Weather data**: Open-Meteo APIs (no API key needed). The geocoding API resolves city names, and the forecast API returns current conditions and hourly data.

**Scorers are registered twice**: once on the agent definition (in `agents/`) and again in the `Mastra` constructor in `index.ts`. Both registrations are required for evaluations to appear in the Studio.

**Workflow pattern**: `weatherWorkflow` chains two steps — `fetchWeather` calls the Open-Meteo API directly, then `planActivities` calls `weatherAgent.stream()` with a structured prompt. Steps share state via the workflow's context object.

## Project Structure

| Path | Purpose |
|------|---------|
| `src/mastra/index.ts` | Central Mastra config — register all agents, workflows, scorers here |
| `src/mastra/agents/` | Agent definitions: model, tools, memory, instructions, scorers |
| `src/mastra/tools/` | Reusable tools with Zod-validated input/output schemas |
| `src/mastra/workflows/` | Multi-step orchestration using `createWorkflow` / `createStep` |
| `src/mastra/scorers/` | Evaluation scorers (prebuilt or custom LLM-as-judge) |
| `src/mastra/public/` | Copied into build output as-is; contains auto-generated DB files |
| `.agents/skills/mastra/` | Downloaded Mastra skill docs — do not edit manually |
| `.mastra/` | Build artifacts — do not edit manually |

## Boundaries

- Register new agents, tools, workflows, and scorers in `src/mastra/index.ts`
- Use Zod schemas for all tool inputs and outputs
- Never modify files in `.mastra/`, `src/mastra/public/*.db*`, or `node_modules`
- Never hardcode API keys — always use environment variables

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Mastra skill discovery](https://mastra.ai/.well-known/skills/index.json)

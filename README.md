# 🌱 agent-studio

<div align="center">

![Mastra](https://img.shields.io/badge/Mastra-1-000000?style=for-the-badge&logo=mastra&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![DeepSeek](https://img.shields.io/badge/DeepSeek-4D6BFE?style=for-the-badge&logo=deepseek&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-3DA639?style=for-the-badge&logo=creativecommons&logoColor=white)

**My laboratory for production-grade AI agents: a conversational onboarding guide ("Bonsai") that walks new team members through their company's learning route, answers questions with RAG over uploaded resources, remembers progress — and recommends library content when it fits.**

[Architecture](#-architecture) •
[Monorepo map](#-monorepo-map) •
[Agents · Workflows · Tools](#-agents--workflows--tools) •
[Quick start](#-quick-start)

</div>

---

## ✨ What this lab explores

- 🤖 **Multi-agent systems with [Mastra](https://mastra.ai)**: specialist agents (main guide, evaluator, role-play coach, composer) sharing tools and memory
- 🔎 **RAG done properly**: ingestion/indexing workflows, `PgVector` over Postgres, embeddings via OpenAI, resource-scoped retrieval
- 🧠 **Agent memory**: working memory per learner, progress tracked as domain state, not chat history hacks
- 🏢 **Multi-tenancy from day one**: every resource, query, route and memory is org-scoped — a request without a resolved `organizationId` is rejected
- 🔐 **Custom auth on an agent server**: JWT HS256 (`MastraJwtAuth`), Bearer tokens, role-based access (manager vs learner)
- 📐 **Documentation-first development**: specs and contracts written before implementation (see [`docs/`](docs))
- 🧪 **E2E confidence**: full Playwright suite against the real stack

---

## 🏗️ Architecture

```
┌─────────────────────┐     HTTP/SSE      ┌──────────────────────────────┐
│  Bonsai Front        │ ───────────────▶ │  Mastra Server               │
│  (React + bonsai-ui) │ ◀─────────────── │  - Bonsai agent + Memory     │
│  chat · route graph  │     stream        │  - Workflows (ingest/index)  │
│  manager panel       │                   │  - Tools (RAG, route, eval)  │
└─────────────────────┘                   │  - registerApiRoute uploads  │
                                          └───────────────┬──────────────┘
                            ┌─────────────────────────────┼─────────────────┐
                            ▼                             ▼                 ▼
                  ┌──────────────────┐      ┌──────────────────┐  ┌───────────────┐
                  │ Postgres +       │      │ OpenAI           │  │ DeepSeek API  │
                  │ pgvector         │      │ (embeddings)     │  │ (generation)  │
                  │ data · vectors · │      └──────────────────┘  └───────────────┘
                  │ memory           │
                  └──────────────────┘
```

---

## 📁 Monorepo map

```
apps/
├── mastra/        # Agent server: agents, workflows, tools, RAG, auth, custom routes
├── bonsai/        # React front: chat, route graph, learning views + bonsai-ui lib
└── e2e/           # Playwright suite (a11y + smoke) against the real stack
docs/              # Specs-first documentation (Spanish): vision, use cases, API contract
```

## 🤖 Agents · Workflows · Tools

| Layer | Highlights |
| --- | --- |
| **Agents** | `bonsai` (main guide + memory) · `evaluator` (rubric grading) · `roleplay` (practice coach) · `composer` · demo `weather-agent` |
| **Workflows** | index-resource · assign-route · quick-review · reexplain-lesson · weekly-goal · team-digest · team-at-risk · role-play |
| **Tools** | rag-query · evaluate-answer · grade-quiz · get-route-and-progress · mark-step-complete · present-resource · recommend-resources |

---

## 🚀 Quick Start

```bash
# 1. Install & configure the agent server
cd apps/mastra
npm install
cp .env.example .env      # DEEPSEEK_API_KEY, OPENAI_API_KEY, DATABASE_URL, JWT_SECRET

# 2. Run the Mastra dev server (agents playground + API)
npm run dev               # http://localhost:4111

# 3. (optional) E2E suite
cd ../e2e && npm install && npx playwright test
```

| Env var | Purpose |
| --- | --- |
| `DEEPSEEK_API_KEY` | Agent brain (generation) |
| `OPENAI_API_KEY` | Embeddings for RAG + memory |
| `DATABASE_URL` | Postgres + pgvector (data, vectors, memory) |
| `JWT_SECRET` | HS256 signing for the auth layer |

---

## 📚 Lab notes

The design docs (in Spanish) live in [`docs/`](docs): architecture vision, use cases (identity/org, catalog, RAG indexing, chat route), auth API contract and the continuation plan.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

**An architecture lab by [Carlos Balsalobre](https://github.com/Balsalobre)**

</div>

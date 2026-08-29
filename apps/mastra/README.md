# bonsai — backend (Mastra)

Backend del prototipo **bonsai**: un asistente conversacional de onboarding
construido sobre Mastra. Guía al recién llegado por la ruta de su empresa,
responde con RAG citando, y recuerda su progreso, todo aislado por
organización.

> Especificación funcional completa en [`../../docs/`](../../docs/).

## Arquitectura en una pantalla

```
Frontend (apps/bonsai)
   │  REST + SSE (Authorization: Bearer <JWT>)
   ▼
Mastra server (apps/mastra)
   ├─ /dev/login           — sign JWT (HS256) por email semilla
   ├─ /resources/*         — manager (subir PDF / LE, listar)
   ├─ /route /progress     — learner
   ├─ /resources/:id/open  — learner (consume)
   ├─ /chat (SSE)          — learner → agente Bonsai
   │
   ├─ bonsai            (deepseek/deepseek-chat) + 7 tools + Memory
   ├─ evaluator-agent   (deepseek/deepseek-reasoner) — juez de rúbrica
   └─ weather-agent     (intocado del scaffold)

Postgres (Neon + pgvector)
   ├─ Prisma (organizations / users / resources / learner_progress)
   ├─ mastra_* (PostgresStore: hilos / mensajes / working memory)
   └─ vector index: resource_chunks (3072d, cosine, flat, openai-3-large)
```

## Variables de entorno

`apps/mastra/.env` (copia de `.env.example`):

| Variable                | Para qué                                                   |
|-------------------------|------------------------------------------------------------|
| `DEEPSEEK_API_KEY`      | Generación: bonsai + evaluator                             |
| `OPENAI_API_KEY`        | Embeddings `text-embedding-3-large` (RAG, indexación)      |
| `DATABASE_URL`          | Conexión pooled a Postgres (runtime)                       |
| `DATABASE_URL_UNPOOLED` | Conexión directa (migraciones Prisma 7)                    |
| `JWT_SECRET`            | HS256 — firma y verifica los Bearer tokens                 |

## Setup local

```bash
cd apps/mastra
bun install
```

### 1. Postgres + pgvector

Con `DATABASE_URL` apuntando a una BD nueva o existente:

```bash
bun run scripts/db-bootstrap.ts   # CREATE EXTENSION IF NOT EXISTS vector
bunx prisma migrate dev           # crea tablas Prisma; respeta mastra_*
bunx prisma generate              # cliente
```

> Las tablas `mastra_*` (creadas por `PostgresStore` al arrancar) están
> marcadas como **externas** en `prisma.config.ts` para que Prisma nunca
> intente migrarlas / dropearlas.

### 2. Seeds

Genera org Acme, 1 manager, 1 learner, **9 recursos** (3 PDFs sintéticos
via `pdf-lib` para la ruta, 1 LE externa, 3 mocks ricos en metadata, y
2 PDFs reales de INCIBE descargados a `seed/assets/`) e indexa todo en
pgvector:

```bash
bun run scripts/seed-bonsai.ts
```

Es idempotente. Si `OPENAI_API_KEY` aún es placeholder, los recursos quedan
en `status='error'` y la indexación se pospone — vuelve a correr el seed
cuando la clave esté lista.

### 3. Dev server

```bash
bun run dev          # http://localhost:4111
```

Studio embebido (`/studio` en local) lista los agentes, hilos y herramientas.

## Probar la demo (cURL)

```bash
# 1. login como learner
TOKEN=$(curl -sX POST localhost:4111/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"learner@acme.us"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

# 2. ver la ruta y el progreso
curl -s -H "Authorization: Bearer $TOKEN" localhost:4111/route | python3 -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" localhost:4111/progress

# 3. chatear con Bonsai (SSE)
curl -N -X POST localhost:4111/chat \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"message":"Hola, soy nuevo. ¿Por dónde empiezo?"}'

# 4. abrir un recurso (registra consume; si está en un step consume, lo cierra)
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  localhost:4111/resources/res-welcome-pdf/open
```

Como manager:

```bash
ADMIN=$(curl -sX POST localhost:4111/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager@acme.us"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

curl -s -H "Authorization: Bearer $ADMIN" localhost:4111/resources | python3 -m json.tool
curl -X POST localhost:4111/resources/pdf -H "Authorization: Bearer $ADMIN" \
  -F file=@/path/to/my.pdf
```

## Estructura

| Path                                         | Qué hay                                                  |
|----------------------------------------------|----------------------------------------------------------|
| `src/mastra/index.ts`                        | Composición central: agents/workflows/routes/auth/store  |
| `src/mastra/env.ts`                          | Carga `.env` y valida vars requeridas                    |
| `src/mastra/domain/`                         | Prisma client, tipos, route loader, vector store         |
| `src/mastra/agents/`                         | `bonsai`, `evaluator`, `weather-agent`                   |
| `src/mastra/tools/`                          | 7 tools de Bonsai + helper de contexto                   |
| `src/mastra/workflows/`                      | `index-resource` (chunk/embed/upsert)                    |
| `src/mastra/server/`                         | `auth.ts`, `dev-login.ts`, `resources.ts`, `learner.ts`  |
| `src/mastra/seed/routes/<orgId>.json`        | Ruta semilla (importada estáticamente, no fs)            |
| `src/mastra/seed/assets/*.pdf`               | PDFs reales que el seed sube al catálogo (INCIBE)        |
| `prisma/schema.prisma`                       | organizations / users / resources / learner_progress     |
| `scripts/seed-bonsai.ts`                     | Seed end-to-end (genera PDFs, ruta, indexa)              |
| `scripts/db-bootstrap.ts`                    | `CREATE EXTENSION IF NOT EXISTS vector`                  |
| `scripts/smoke-auth.ts`                      | Verifica interop jose → MastraJwtAuth                    |
| `scripts/dump-token.ts` / `dump-learner-token.ts` | Tokens manuales para cURL                           |

## Contrato API (resumen DOC 06)

| Método | Ruta                          | Rol     | Notas                                       |
|--------|-------------------------------|---------|---------------------------------------------|
| POST   | `/dev/login`                  | public  | `{email}` → `{token,user}` (HS256)          |
| POST   | `/resources/pdf`              | manager | multipart `file=@…`; parsea + indexa        |
| POST   | `/resources/learning-experience` | manager | `{title,url,metadata}`                   |
| GET    | `/resources`                  | manager | catálogo de la org                          |
| GET    | `/route`                      | learner | ruta JSON de la org (404 si no hay)         |
| GET    | `/progress`                   | learner | filas `learner_progress` del learner        |
| POST   | `/chat`                       | learner | **SSE**, body `{message,threadId?}`         |
| POST   | `/resources/:id/open`         | learner | registra consume + auto-completa step       |

Errores: `{error:{code,message}}` con `code` en `{BAD_REQUEST, UNAUTHORIZED,
FORBIDDEN, NOT_FOUND}`.

`/chat` emite frames SSE `data: {"type":"text","delta":"..."}` mientras
genera y un `event: done` final con `{"type":"done","threadId","stepCompleted?"}`.

## Auth + scoping

- JWT HS256: claims `{ sub, organizationId, role: 'admin'|'user' }`.
  `admin → manager`, `user → learner` en dominio.
- `requireAuth()` middleware verifica el Bearer y pone `userId`,
  `organizationId`, `role` + `MASTRA_RESOURCE_ID_KEY = org:{org}:user:{sub}`
  en el `requestContext`.
- `requireRole('manager'|'learner')` filtra por rol.
- RAG: `applyRagContext(requestContext, organizationId)` fija `filter:
  { organizationId: { $eq: org } }` y `topK: 4` **por request**. El
  `ragQueryTool` se crea sin `enableFilter`, así el LLM no puede modificarlo.

## Criterios de aceptación (DOC 0 §7)

| Criterio                                                       | Estado     | Cómo se verifica                                     |
|----------------------------------------------------------------|------------|------------------------------------------------------|
| 1. Manager sube PDF → catálogo + indexed                       | ⏳ depende OPENAI | `curl POST /resources/pdf -F file=@…` con la key |
| 2. Manager define ruta de onboarding                           | ✅          | Seed escribe `seed/routes/acme-org.json`             |
| 3. Learner abre chat: guía + RAG citado                        | ⏳ depende OPENAI | `/chat` con `OPENAI_API_KEY` real + recursos indexed |
| 4. Bonsai recuerda progreso entre mensajes y sesiones          | ✅ (memoria configurada) | Working memory `resource`-scoped en PostgresStore   |
| 5. Aislamiento por organización                                | ✅          | `filter.organizationId` forzado por server; UI tests con dos orgs distintas pendientes |

## Pendiente para hackatón final

- Subir `OPENAI_API_KEY` real y re-ejecutar `bun run scripts/seed-bonsai.ts`
  para indexar (sin esto los recursos quedan en `status='error'`).
- Smoke test del `/chat` con preguntas que disparen RAG y citas.
- Probar quiz + evaluation flows desde el frontend.
- Configurar `OPENAI_API_KEY` y `JWT_SECRET` también en Vercel (preview +
  production).
- Endurecer CORS antes de prod (actualmente `origin: '*'`, no usa
  cookies — solo Bearer, así que es seguro pero conviene fijar el origin
  del frontend).

## Comandos útiles

```bash
bunx tsc --noEmit -p tsconfig.json     # typecheck rápido
npm run build                           # bundle Vercel (.mastra/output/)
npm run start                           # arranca el bundle
bun run scripts/db-bootstrap.ts         # asegura pgvector
bun run scripts/seed-bonsai.ts          # (re)siembra y re-indexa
bun run scripts/smoke-auth.ts           # interop jose ↔ MastraJwtAuth
bun run scripts/list-tables.ts          # lista tablas y enums de la BD
```

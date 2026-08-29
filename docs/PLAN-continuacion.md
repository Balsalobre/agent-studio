# PLAN de continuación — Backend bonsai (agente "bonsai") sobre Mastra

> App = **bonsai**. Agente conversacional = **bonsai**. Este documento es el handoff para
> retomar el trabajo en una sesión nueva sin re-investigar. Pega el bloque de prompt de
> abajo (o di "continúa con el plan de docs/PLAN-continuacion.md").

---

## Prompt de continuación (cópialo tal cual)

```
Ultrathink. Continúa construyendo el backend del prototipo "bonsai": un asistente
conversacional de onboarding (el agente se llama "bonsai") sobre Mastra. App = bonsai,
agente = bonsai. Trabaja por fases con commit al final de cada una. PLANIFICA y enséñame
el plano de fases + contratos ANTES de codificar; espera mi OK; luego ejecuta fase a fase
parando a confirmar tras cada una.

## Estado de la investigación (YA HECHA — no la repitas)
Specs leídas (fuente de verdad, ganan sobre intuición): docs/00..06. Decisiones clave:
- D-0.1/1.1/6.1: orgId+role viajan como claims del JWT { sub, organizationId, role };
  role admin=manager, user=learner. orgId SIEMPRE se lee de contexto, nunca hardcode.
- Runtime DeepSeek (deepseek/deepseek-chat; deepseek-reasoner para evaluateAnswer).
  Embeddings SOLO OpenAI text-embedding-3-small (1536 dims) en createIndex/upsert/query.
- Ruta de onboarding = JSON semilla, solo lectura. 3 completados: consume / evaluation
  (LLM juzga vs rúbrica, sin score) / quiz (vs JSON, passScore). LE externa = URL placeholder,
  consume al abrir. Recursos: pdf (unpdf, sin OCR, parse en memoria), learning_experience,
  y mocks ebook/audio/video con metadatos ricos (description/author/tags/level/language/
  pages|durationSec). Todo recurso aporta texto indexable.
- RAG: un índice 'resource_chunks', filtro por organizationId por request, topK 4, reranker
  fuera. Memoria: working memory resource-scoped (resource = org:{orgId}:user:{userId}),
  semanticRecall OFF, generateTitle ON. Dominio en Prisma; vectores+memoria los gestiona
  Mastra (PgVector + PostgresStore). Ejecutar CREATE EXTENSION IF NOT EXISTS vector.
- Contrato DOC 06 literal: POST /dev/login; manager: POST /resources/pdf (multipart),
  POST /resources/learning-experience, GET /resources; learner: GET /route, GET /progress,
  POST /chat (SSE deltas {type:'text',delta} + event:done {stepCompleted?}),
  POST /resources/:id/open. Errores {error:{code,message}} 401/403/404/400. CORS al front.
  Rutas a medida con registerApiRoute (no pueden empezar por /api). Bearer en todas.

## API Mastra verificada contra docs embebidos (node_modules/@mastra/*/dist/docs) — usa ESTO
- Modelo: el router acepta string 'provider/model'. OJO: el provider-registry NO listó
  'deepseek/deepseek-chat' (sí deepseek-reasoner, deepseek-v4-pro/flash). El código actual
  usa deepseek('deepseek-chat') de @ai-sdk/deepseek y funciona. PRIMERA TAREA: corre
  .agents/skills/mastra/scripts/provider-registry.mjs y resuelve esta discrepancia antes de
  fijar el string del modelo. No rompas el weatherAgent existente.
- Auth: new MastraJwtAuth({ secret }) de @mastra/auth (instalar). Verifica Bearer HS256.
  /dev/login firma el JWT con jsonwebtoken|jose usando el MISMO secret. Sustituye el
  SimpleAuth actual de src/mastra/index.ts (que hoy usa ADMIN_API_TOKEN/USER_API_TOKEN).
- registerApiRoute(path,{method,handler,middleware,requiresAuth,cors}); handler Hono:
  c.get('mastra'), c.get('requestContext'), c.req.param/query/json/formData, c.json(x,code),
  c.streamText(async write=>...) para SSE. Middleware lee Authorization, verifica token y
  hace requestContext.set(MASTRA_RESOURCE_ID_KEY,resource) + set('organizationId') +
  set('role'). Keys MASTRA_RESOURCE_ID_KEY/MASTRA_THREAD_ID_KEY de @mastra/core/request-context.
- RAG: createVectorQueryTool({vectorStoreName:'pgVector',indexName:'resource_chunks',
  model: embedding openai, enableFilter:true}). Filtro por request: requestContext.set('filter',
  { organizationId: { $eq: orgId } }). El vectorStoreName casa con la key de Mastra
  vectors:{ pgVector: new PgVector({connectionString}) }. createVectorQueryTool vive en
  @mastra/rag (instalar). Sintaxis filtros = estilo Mongo (reference-rag-metadata-filters.md).
- PgVector.createIndex({indexName,dimension:1536,metric:'cosine'}); .upsert({indexName,
  vectors:number[][], metadata:Record[], ids?}).
- Chunking: MDocument.fromText(text).chunk({strategy:'recursive', maxSize:512, overlap:50})
  (es maxSize, NO size). embedMany({model, values}) se importa de 'ai'; model puede ser
  new ModelRouterEmbeddingModel('openai/text-embedding-3-small') de @mastra/core/llm o el de
  @ai-sdk/openai. Devuelve { embeddings: number[][] }.
- Workflow: createWorkflow({id,inputSchema,outputSchema}).then(step).commit();
  createStep({id,inputSchema,outputSchema,execute}); execute recibe {inputData, mastra,
  requestContext, getStepResult, suspend,...}. Acceso a vectores/storage vía `mastra`. Run:
  const run = await wf.createRunAsync(); await run.start({inputData}).
- Memory: new Memory({ storage: PostgresStore, options:{ workingMemory:{enabled:true,
  scope:'resource', template:'...'}, semanticRecall:false, generateTitle:true }}). En
  agent.stream(msgs,{ memory:{ resource:`org:${orgId}:user:${userId}`, thread:threadId },
  requestContext }). Stream: for await (const c of stream.fullStream) con c.type==='text-delta'
  -> c.payload.text; o stream.textStream para solo texto.

## Paquetes a instalar en apps/mastra (aditivo, sin romper deploy)
@mastra/rag, @ai-sdk/openai, @mastra/auth, unpdf, prisma + @prisma/client, jsonwebtoken
(+ @types/jsonwebtoken) o jose. Verifica versiones compatibles con @mastra/core ^1.37.

## Estado del repo
- Monorepo apps/mastra (backend) + apps/studio-spa + apps/bonsai (UI front, ya hay jsx/css).
- apps/mastra/src/mastra/index.ts: ya tiene PostgresStore, SimpleAuth (a reemplazar),
  weatherAgent/weatherWorkflow/scorers (NO tocar), testRoutes (/hello).
- env.ts exige DEEPSEEK_API_KEY, DATABASE_URL, ADMIN_API_TOKEN, USER_API_TOKEN.
  Añade OPENAI_API_KEY y el secret del JWT; deja ADMIN/USER token si el SimpleAuth se quita.
- Nada de Prisma/unpdf/rag instalado aún.

## Plan por fases (commit al final de cada una)
F0 Prep: instalar paquetes, @ai-sdk/openai embeddings, CREATE EXTENSION vector, init Prisma.
F1 Dominio Prisma: organizations, users, resources, learner_progress + migración. Ruta=JSON
   semilla (no tabla). Tipos compartidos.
F2 Auth MastraJwtAuth + middleware org-scoping (admin/user) + POST /dev/login.
F3 Recursos: POST /resources/pdf (unpdf->texto+meta), /learning-experience, GET /resources +
   workflow index-resource (chunk recursive 512/50 -> embedMany OpenAI -> PgVector.upsert con
   metadata {organizationId,resourceId,resourceType,title,page?,text}).
F4 RAG: createVectorQueryTool con filtro organizationId por requestContext, topK 4.
F5 Agente bonsai (DeepSeek) + tools: ragQueryTool, getRouteAndProgress, presentResource,
   evaluateAnswer (deepseek-reasoner), gradeQuiz, markStepComplete, recommendResources + Memory.
F6 Endpoints DOC 06 incl. /chat SSE (deriva orgId/userId/thread del token) + CORS + errores.
F7 Seeds: org Acme, 1 manager + 1 learner, ruta JSON con un paso de cada tipo, 1 PDF real +
   1 LE externa placeholder + 3 mocks ricos; indexa todos.
F8 Verificación: build sin errores de tipos, prueba en Studio, criterios de aceptación, README.

## Reglas
Cambios aditivos; no romper weatherAgent ni el deploy. Donde la API no sea 100% segura,
CONSULTA docs embebidos (la skill mastra está en .agents/skills/mastra) y deja comentario con
la fuente. Tras cada fase: resume, corre typecheck/build, para a confirmar. README final con
env vars, migraciones, seed, mastra dev y cómo probar la demo.

Empieza por: (1) corre provider-registry.mjs y resuelve el string del modelo DeepSeek,
(2) enséñame el plan F0-F1 detallado con el schema Prisma y los contratos de tipos, y espera
mi OK antes de escribir código.
```

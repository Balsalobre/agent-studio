# DOC 0 — Visión & Arquitectura

> Estado: `draft v0.1` · Documento ancla. El resto de UCs heredan de aquí el stack, el modelo multi-tenant y el modelo de datos global.

## 1. Producto en una frase

Un **chat tipo Claude que hace de _bonsai_** durante el onboarding: guía al recién llegado por la ruta definida por su empresa y responde sus dudas fundamentándose (RAG) en los recursos que el manager sube o conecta, recordando su progreso. Además, cuando es **coherente con la ruta**, puede **recomendar (e incluso sugerir/vender) otros recursos de la biblioteca**  que le vengan bien. Todo aislado **por organización**.

**Resuelve in & out**: onboarding de nuestra propia empresa (in) y producto vendible a otras empresas (out). Por eso la organización es ciudadano de primera clase desde el día 1, aunque arranquemos con una sola.

## 2. Principios de diseño

- **Org-scoping obligatorio.** Ningún recurso, consulta, ruta o memoria existe fuera de una `organizationId`. Una request sin organización resuelta se rechaza.
- **Multi-tenant de diseño, single-tenant de ejecución.** El modelo soporta N organizaciones; en el hackatón hay **una configurada** (seed). El superadmin que las gestiona es futuro.
- **Documentation-first.** Estos docs definen contratos antes de implementar.
- **Separación de modelos** (cerrado en cursillo previo):
  - **Claude Code** → desarrollo.
  - **DeepSeek** (`deepseek/deepseek-chat`, `deepseek-reasoner` para razonar) → cerebro del bonsai en runtime.
  - **OpenAI `text-embedding-3-small`** (1536 dims) → embeddings del RAG y la memoria. Ningún otro proveedor da embeddings.

## 3. Arquitectura

```
┌─────────────────────┐     HTTP/SSE      ┌──────────────────────────────┐
│  Frontend (Claude    │ ───────────────▶ │  Mastra Server  (Vercel)     │
│  Design)             │                   │  - Agente Bonsai             │
│  - Chat bonsai        │ ◀─────────────── │  - Workflows (ingesta/index) │
│  - Panel manager      │     stream        │  - Tools (RAG, ruta, progreso)│
└─────────────────────┘                   │  - registerApiRoute (uploads)│
                                            └───────────────┬──────────────┘
                                  ┌─────────────────────────┼───────────────────────┐
                                  ▼                         ▼                       ▼
                        ┌──────────────────┐   ┌────────────────────┐   ┌──────────────────┐
                        │ Vercel Postgres  │   │ OpenAI Embeddings   │   │ DeepSeek API     │
                        │  + pgvector      │   │  (text-embedding-   │   │ (generación)     │
                        │  datos + vectores│   │   3-small)          │   │                  │
                        │  + memoria       │   └────────────────────┘   └──────────────────┘
                        └──────────────────┘
        Mastra Studio (Vercel) → banco de pruebas de agentes/workflows/memoria
```

Componentes Mastra:
- **Agente `bonsai`** — DeepSeek + tools (RAG, lookup de ruta, update de progreso) + Memory.
- **Workflows** — pipeline de ingesta/indexación de recursos (UC3).
- **RAG** — `PgVector` sobre Vercel Postgres (pgvector), embeddings OpenAI.
- **Memory** — `@mastra/memory` con storage Postgres; working memory resource-scoped por learner (UC5).
- **Server** — endpoints a medida (`registerApiRoute`) para upload de PDFs y CRUD de ruta/recursos.

## 4. Multi-tenancy

- `organizationId` en **todas** las tablas de dominio y en el `metadata` de cada vector.
- El RAG filtra **siempre** por `organizationId` (metadata filter en la query vectorial) → aislamiento de conocimiento entre empresas.
- La memoria usa `resource = org:{orgId}:user:{userId}` para que el scope nunca cruce organizaciones.
- Hoy: una org sembrada por config/seed. Futuro: superadmin da de alta orgs y managers.

## 5. Modelo de datos global (resumen)

Detalle por tabla en cada UC. Visión de conjunto:

| Tabla | Propósito | UC |
|---|---|---|
| `organizations` | Tenants (empresas) | UC1 |
| `users` | Managers y learners, atados a una org | UC1 |
| `resources` | Catálogo (pdf, learning_experience, mocks) | UC2 |
| `resource_chunks` | Chunks + vectores (pgvector) | UC3 |
| `onboarding_routes` | Ruta definida por el manager | UC4 |
| `route_steps` | Pasos de la ruta + recursos asociados | UC4 |
| `learner_progress` | Estado del learner por paso | UC5 |
| `mastra_threads` / `mastra_messages` / `mastra_resources` | Memoria de Mastra | UC5 |

## 6. Stack & deployment

- **Runtime:** Mastra server desplegado en **Vercel** (ya hecho). Mastra Studio en Vercel (ya hecho).
- **DB:** **Vercel Postgres** (Neon) con extensión **pgvector** — datos de dominio + vectores + memoria, todo en la misma BBDD para ir rápido.
- **Frontend:** diseñado en **Claude Design**, consume la API del server Mastra (REST + SSE para el stream del chat).
- **Modelos:** DeepSeek (gen) + OpenAI (embeddings) vía model router de Mastra (env `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`).

> ⚠️ **Gotcha de Vercel (serverless):** el filesystem es efímero. Los PDFs subidos **no se pueden guardar en disco**. Estrategia: al subir, **parsear el texto en el acto y persistir texto+metadatos en Postgres**; el binario es opcional (Vercel Blob si hace falta conservarlo). Se decide en UC2.

## 7. Criterios de aceptación de la demo (end-to-end)

1. Como **manager**: subo un PDF real, aparece en el catálogo y queda indexado.
2. Defino una **ruta de onboarding** con pasos y recursos.
3. Como **learner** de esa org: abro el chat bonsai, me **guía por la ruta**, le pregunto algo y responde **con RAG citando** el recurso.
4. El bonsai **recuerda** mi progreso entre mensajes/sesiones.
5. Todo lo anterior está **aislado a mi organización**.

## 8. Decisiones transversales (cerradas)

- **D-0.1** `organizationId` se resuelve desde un **claim del token** de auth de Mastra (no header/config). El código lee siempre `organizationId` del contexto.
- **D-0.2** El **contrato de API se define aquí/en los UCs** (REST + SSE); el frontend de Claude Design se adapta a él.
- **D-0.3** Del PDF se persiste **solo el texto extraído + metadatos**; el binario se descarta (sin Vercel Blob en v1).
- **D-0.4** La _learning experience_ es un **learning path real de la plataforma accesible por URL**; aporta texto descriptivo indexable y se completa al navegarla (detalle en UC2/UC4).
- **D-0.5** **Auth = token integrado de Mastra**, suficiente para la demo. El token lleva un `role` con dos valores: **`admin` (= manager)** y **`user` (= learner)**. En los docs usamos los términos de dominio manager/learner; en el token son admin/user.
- **D-0.6** El **"motor de búsqueda" es el propio índice pgvector**: una vez todo indexado, la búsqueda/retrieval se hace sobre él. No hay Solr ni buscador aparte.
- **D-0.7** **Conectores a servicios externos = fuera de v1.** Si aparece un recurso externo, se representa **solo con un enlace** (como la LE de la plataforma).
- **D-0.8** El bonsai puede **recomendar recursos fuera de la ruta** del catálogo de la org cuando sean **coherentes** con el contexto del learner (la plataforma es una biblioteca; cabe recomendar o sugerir/vender). Detalle en UC4.

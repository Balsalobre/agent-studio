# UC3 — Indexación & RAG

> Estado: `draft v0.1` · Depende de DOC 0, UC1, UC2. Convierte los recursos en conocimiento recuperable por el bonsai, aislado por organización y con citación de fuentes.

## 1. Objetivo

Indexar el texto de los recursos (texto completo de PDFs + texto descriptivo del resto) en pgvector, y exponer al bonsai una **tool de retrieval** que devuelva los fragmentos relevantes **solo de su organización**, con la fuente para poder citar.

## 2. Alcance

**In:**
- Workflow de indexación por recurso (chunk → embed → upsert).
- Índice pgvector en Vercel Postgres, embeddings OpenAI `text-embedding-3-small` (1536).
- `createVectorQueryTool` con **filtro obligatorio por `organizationId`**.
- Metadatos de cita en cada chunk (recurso, título, tipo, página si aplica).

**Out:**
- GraphRAG.
- Re-indexado incremental / detección de cambios.
- Transcripción de audio/vídeo (los mocks se indexan solo por su texto descriptivo).

**Stretch:**
- Reranker (`reranker` en la query tool) para subir precisión.

## 3. Requisitos funcionales

- **RF-3.1** Al quedar un recurso en `indexing`, se ejecuta el workflow `index-resource`.
- **RF-3.2** El texto se trocea (`recursive`, ~512 tokens, overlap ~50) y se embebe con OpenAI.
- **RF-3.3** Cada chunk se guarda con metadata: `{ organizationId, resourceId, resourceType, title, page? }` + el propio `text`.
- **RF-3.4** El retrieval del bonsai filtra **siempre** por `organizationId`; jamás devuelve chunks de otra org.
- **RF-3.5** El resultado del retrieval incluye los metadatos de fuente para que el bonsai **cite** (título del recurso, página si la hay).
- **RF-3.6** Todos los tipos de recurso producen al menos un chunk (PDF: su texto; LE/mocks: título + descripción + metadatos).

## 4. Pipeline de indexación (workflow Mastra)

```
index-resource (createWorkflow)
  input: { resourceId }
  1. load        → SELECT extracted_text / texto descriptivo del recurso (scoped a su org)
  2. buildText   → PDF: extracted_text · LE/mock: `${title}\n${description}\n${metadata}`
  3. chunk       → MDocument.fromText(text).chunk({ strategy:'recursive', size:512, overlap:50 })
  4. embed       → embedMany({ model: openai.embedding('text-embedding-3-small'), values })
  5. upsert      → PgVector.upsert({ indexName:'resource_chunks', vectors, metadata:[...] })
  6. markIndexed → UPDATE resources SET status='indexed'
```

Notas:
- El **texto a indexar** lo prepara el paso 2 según tipo (RF-3.6). Para PDFs cortos, `size:512` suele dar pocos chunks; correcto.
- `upsert` debe incluir `text` y los metadatos de cita en cada vector (PgVector los guarda junto al embedding).

## 5. Modelo de datos (vectores)

Índice gestionado por `PgVector` (`@mastra/pg`) sobre Vercel Postgres:

```
indexName: 'resource_chunks'   dimension: 1536
metadata por vector: {
  organizationId,   // filtro de aislamiento (obligatorio en toda query)
  resourceId,       // para citar y para agrupar
  resourceType,     // pdf | learning_experience | ebook | audio | video
  title,            // texto de la cita
  page,             // opcional (PDF)
  text              // contenido del chunk (lo que lee el bonsai)
}
```

> Decisión: **un único índice** con filtro por `organizationId` en metadata (más simple que un índice por org para el hackatón). Misma `dimension: 1536` en `createIndex`, `upsert` y la query tool.

## 6. Tool de retrieval (la que usa el bonsai)

```ts
import { createVectorQueryTool } from '@mastra/rag'
import { openai } from '@ai-sdk/openai'

export const ragQueryTool = createVectorQueryTool({
  vectorStoreName: 'pgVector',
  indexName: 'resource_chunks',
  model: openai.embedding('text-embedding-3-small'),
  // reranker: { model: 'openai/gpt-4o-mini' },   // stretch
})
```

El **filtro por organización** se inyecta por request (no puede ser fijo): el `organizationId` del contexto del learner se pasa como `filter: { organizationId: { $eq: orgId } }` al invocar el retrieval. Ver OQ-3.1 para el mecanismo exacto (runtimeContext vs. tool wrapper).

## 7. Flujos

**Indexar (tras subir PDF / registrar LE / seed de mocks):**
```
resource registrado → status=indexing → workflow index-resource → status=indexed
```

**Recuperar (durante el chat):**
```
pregunta del learner → bonsai llama ragQueryTool (filtro orgId) 
   → top-K chunks de SU org → respuesta citando título/página
```

## 8. Criterios de aceptación

- Subo un PDF, pregunto por su contenido y el bonsai responde **citando** ese PDF (y página si aplica).
- Pregunto por un recurso mock (p.ej. el vídeo) y el bonsai puede **describirlo/recomendarlo** desde su texto descriptivo.
- Una consulta nunca devuelve fragmentos de otra organización.

## 9. Decisiones (cerradas)

- **D-3.1** El filtro `organizationId` se inyecta por request vía **`runtimeContext`** (el orgId del contexto del learner) + `filter` dinámico en la query tool. A implementar contra la API actual de Mastra (consultar vía MCP de docs).
- **D-3.2** **Reranker = stretch** (fuera de v1). Se deja el hook preparado pero desactivado.
- **D-3.3** `topK` por defecto = **4**.
- **D-3.4** La LE de la plataforma se indexa **solo con título + descripción + metadatos** (sin scraping de la URL).
- **D-3.5** El retrieval opera sobre **todo el catálogo de la org**, no solo sobre los recursos de la ruta. Esto habilita que el bonsai **recomiende recursos coherentes fuera de la ruta** (UC4 D-4.6): los chunks llevan `resourceType` y `resourceId`, así que una misma consulta puede traer tanto material de la ruta como recomendable.

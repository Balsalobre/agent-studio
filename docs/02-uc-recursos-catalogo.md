# UC2 — Recursos & Catálogo

> Estado: `draft v0.1` · Depende de DOC 0 y UC1. Define qué es un recurso, cómo entran y cómo los gestiona el manager. Alimenta el RAG (UC3) y la ruta (UC4).

## 1. Objetivo

Que el **manager** construya el catálogo de recursos de su organización: subir PDFs reales (parseados e indexables), conectar _learning experiences_ reales, y disponer de recursos **mock** (ebook, audio, vídeo) con metadatos para enriquecer la demo "abriendo rápido".

## 2. Alcance

**In (hackatón):**
- **Upload de PDF real** → parsear texto → persistir → encolar indexación (UC3).
- **Learning experience real** → integración con acceso real (ver OQ-2.1).
- **Mocks** de `ebook`, `audio`, `video` precargados (seed JSON) con metadatos (duración, páginas, formato…).
- **Catálogo** (vista del **manager**): lista de recursos con tipo, estado y metadatos.

**Out:**
- Permisos/acceso por recurso individual.
- Conectores a Drive / Confluence / S3 / etc.
- Que el **learner** vea el catálogo (de momento solo manager).
- OCR de PDFs escaneados.

**Stretch:**
- Conector externo adicional si sobra tiempo.
- Borrado/re-indexado de recursos.

## 3. Actores

- **Manager**: única persona que gestiona recursos en esta UC.

## 4. Tipos de recurso

Modelo **unificado** con un campo `type` y `metadata` flexible:

| `type` | Real / Mock | Texto indexable | Notas |
|---|---|---|---|
| `pdf` | **Real** | Sí (extraído al subir) | Núcleo del RAG |
| `learning_experience` | **Real** (URL externa) | Sí (descriptivo) | Se navega por URL; al navegar → completado (UC4) |
| `ebook` | Mock | Sí (texto descriptivo) | Seed JSON |
| `audio` | Mock | Sí (texto descriptivo) | Seed JSON (p.ej. duración) |
| `video` | Mock | Sí (texto descriptivo) | Seed JSON (p.ej. duración) |

> **Todos los recursos aportan algo de texto indexable** (descripción + metadatos) para que el bonsai pueda informar de ellos y recomendarlos, aunque el contenido real (audio/vídeo) no se transcriba. El PDF aporta su texto completo; la LE de la plataforma y los mocks aportan título + descripción + metadatos.

## 5. Requisitos funcionales

- **RF-2.1** El manager sube un PDF; el sistema **extrae el texto en el acto** y guarda texto + metadatos (nº páginas, título, tamaño) con `status = 'indexing' → 'indexed'`.
- **RF-2.2** El manager registra una _learning experience_ real; se guarda la referencia/identificador + metadatos y se marca su accesibilidad.
- **RF-2.3** Los mocks (ebook/audio/video) se precargan por seed y aparecen en el catálogo como recursos abribles, con sus metadatos.
- **RF-2.4** El catálogo lista los recursos **de la org** con `type`, `status`, `title` y metadatos clave; filtrable por tipo.
- **RF-2.5** Todo recurso lleva `organization_id` y nunca aparece en el catálogo de otra org.
- **RF-2.6** Cada recurso indexable queda disponible para el RAG (UC3) y asociable a un paso de la ruta (UC4).

## 6. Modelo de datos

```sql
resources (
  id              uuid pk,
  organization_id uuid not null references organizations(id),
  type            text not null check (type in
                    ('pdf','learning_experience','ebook','audio','video')),
  title           text not null,
  status          text not null default 'registered'
                    check (status in ('registered','indexing','indexed','mock','error')),
  source          jsonb not null default '{}',   -- ver abajo por tipo
  metadata        jsonb not null default '{}',   -- duración, páginas, formato, etc.
  extracted_text  text,                          -- solo pdf (y LE si aplica)
  created_at      timestamptz default now()
)
```

`source` por tipo (propuesta, a confirmar):
```jsonc
// pdf
{ "blobUrl": "https://...", "filename": "manual.pdf" }   // blobUrl opcional (OQ-2.2)
// learning_experience
{ "provider": "external", "url": "https://..." }              // se navega; completado al navegar
// ebook (mock)
{ "format": "epub" }
// audio (mock)
{ "format": "mp3" }
// video (mock)
{ "format": "mp4" }
```

`metadata` por tipo (ejemplos de mocks para el seed):
```jsonc
// ebook  → { "pages": 240, "author": "...", "language": "es" }
// audio  → { "durationSec": 1380, "language": "es" }
// video  → { "durationSec": 540, "resolution": "1080p" }
```

## 7. Flujos

**Subir PDF (real):**
```
manager → POST /resources/pdf (multipart)
        → parsear texto (lib JS serverless-friendly)
        → INSERT resources(type=pdf, status=indexing, extracted_text, metadata{pages,...})
        → disparar workflow de indexación (UC3)
        → status=indexed
```

**Registrar learning experience (real):**
```
manager → POST /resources/learning-experience { ref }
        → integración: validar acceso / traer metadatos (OQ-2.1)
        → INSERT resources(type=learning_experience, source, metadata)
        → (si aporta texto) → indexar; (si no) → recurso "abrible" sin RAG
```

**Mocks (seed):**
```
seed → INSERT 1 ebook + 1 audio + 1 video (status=mock) con metadatos
     → visibles en catálogo para "abrir rápido" en la demo
```

## 8. Decisiones técnicas

- **Parser PDF serverless:** usar una librería JS que funcione en el runtime de Vercel (p.ej. `unpdf`, pensado para serverless/edge; alternativa `pdf-parse` en runtime Node). Confirmar en OQ-2.3.
- **Almacenamiento de fichero:** por el FS efímero de Vercel, **parsear al vuelo y persistir solo el texto+metadatos** en Postgres. Conservar el binario (Vercel Blob) solo si se necesita re-abrir el PDF original (OQ-2.2).
- **Indexación:** desacoplada en workflow (UC3) para no bloquear la subida.
- **LE:** la integración real se aísla tras un "connector" para no acoplar el resto del sistema a un proveedor concreto.

## 9. Criterios de aceptación

- Subo un PDF real → en segundos aparece en el catálogo como `indexed` con su nº de páginas.
- Veo en el catálogo el ebook, el audio y el vídeo mock con sus metadatos (duración/páginas).
- Veo al menos una _learning experience_ real registrada y marcada como accesible.
- El catálogo solo muestra recursos de mi organización.

## 10. Decisiones (cerradas)

- **D-2.1 (era OQ-2.1)** _Learning experience_ = **learning path real de la plataforma, accesible por URL**. El bonsai la presenta con enlace; al navegarla se da por **completada** (mecanismo "consume", UC4). Aporta texto descriptivo indexable.
- **D-2.2** Del PDF se persiste **solo el texto extraído + metadatos**; el binario se descarta (sin Vercel Blob en v1).
- **D-2.3** Parser PDF: **`unpdf`** (serverless-friendly para Vercel). Se asumen **PDFs con texto, sin OCR**.
- **D-2.4** Metadatos **ricos** por recurso: además del mínimo (título, tipo, duración/páginas, idioma), cada recurso lleva **descripción útil + autor + tags + nivel**, de modo que el RAG tenga "algo bueno" que indexar y el bonsai pueda describir/recomendar bien cada uno.
- **D-2.5 (era OQ-2.5)** Se indexa el **texto descriptivo de todos** los recursos (PDF completo + título/descripción/metadatos del resto).
- **D-2.6** **Conectores a servicios externos = fuera de v1.** Cualquier recurso externo se modela como un recurso con `source.url` (solo **enlace**), igual que la LE de la plataforma; no hay ingestión profunda de servicios de terceros.

### Esquema de metadatos rico (para el seed)

```jsonc
metadata: {
  description: "Resumen útil de qué cubre el recurso",  // se indexa
  author: "...",
  tags: ["seguridad", "onboarding"],
  level: "intro | intermedio | avanzado",
  language: "es",
  // específicos por tipo:
  pages: 240,          // pdf / ebook
  durationSec: 1380    // audio / video
}
```

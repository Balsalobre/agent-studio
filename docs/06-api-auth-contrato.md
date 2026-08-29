# DOC 06 — API & Auth (contrato)

> Estado: `draft v0.1` · Depende de DOC 0, UC1–UC5. Define el contrato que consume el frontend (Claude Design) y cómo viajan auth y organización. Criterio: lo más simple que funcione para la demo.

## 1. Autenticación

- **Token integrado de Mastra (JWT Bearer)**. El frontend lo envía en cada request:
  ```
  Authorization: Bearer <token>
  ```
- **Claims del token** (fuente de `userId`, `organizationId`, `role`):
  ```jsonc
  { "sub": "<userId>", "organizationId": "<orgId>", "role": "admin" | "user" }
  ```
  - `role: "admin"` → **manager** · `role: "user"` → **learner**.
- **Cómo se obtiene el token en la demo** (dev): endpoint mínimo que emite el JWT de un usuario sembrado. No hay registro ni IdP.
  ```
  POST /dev/login        body: { "email": "manager@acme.com" }
  → 200 { "token": "<jwt>", "user": { "id","name","role","organizationId" } }
  ```
  > Alternativa aún más simple si urge: tokens semilla preforjados ("entrar como manager" / "entrar como learner"). El endpoint es lo más limpio.

## 2. Scoping (recordatorio, UC1)

- Middleware lee los claims → inyecta `{ userId, organizationId, role }` en el contexto.
- Toda query filtra por `organizationId`. Sin token válido → **401**; rol/organización incorrectos → **403**.
- Rutas a medida con `registerApiRoute` (no pueden empezar por `/api`, reservado por Mastra).

## 3. Endpoints

### Manager (`role: admin`)

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/resources/pdf` | `multipart/form-data` (`file`) | `{ resource }` (status `indexing`→`indexed`) |
| POST | `/resources/learning-experience` | `{ title, url, metadata }` | `{ resource }` |
| GET | `/resources` | — | `{ resources: Resource[] }` (de la org) |

### Learner (`role: user`)

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/route` | — | `{ route }` (la ruta seed de la org) |
| GET | `/progress` | — | `{ progress: LearnerProgress[] }` |
| POST | `/chat` | `{ message, threadId? }` | **SSE** (ver §4) |
| POST | `/resources/:id/open` | — | `{ ok: true, completedStep?: stepId }` (dispara `consume`, UC4) |

### Tipos (resumen, detalle en sus UCs)

```ts
type Resource = {
  id: string; organizationId: string;
  type: 'pdf'|'learning_experience'|'ebook'|'audio'|'video';
  title: string; status: 'registered'|'indexing'|'indexed'|'mock'|'error';
  source: { url?: string; filename?: string; provider?: string };
  metadata: { description?: string; author?: string; tags?: string[];
              level?: string; language?: string; pages?: number; durationSec?: number };
}

type LearnerProgress = {
  routeId: string; stepId: string;
  status: 'pending'|'in_progress'|'completed';
  evidence?: Record<string, unknown>; completedAt?: string;
}
```

## 4. `/chat` — streaming (SSE)

- Request:
  ```jsonc
  POST /chat
  { "message": "¿qué variables necesito para el setup?", "threadId": "session-123" }
  ```
- El handler deriva del token `userId`/`organizationId`/`role`, fija el scope de memoria
  (`resource = org:{orgId}:user:{userId}`, `thread = threadId`) e invoca `bonsai.stream(...)`.
- Response: `Content-Type: text/event-stream`. Deltas de texto del agente (markdown; las **citas y recomendaciones van embebidas como links markdown**, D-4.5). Un evento final marca el cierre y, si aplica, el paso completado:
  ```
  data: {"type":"text","delta":"Necesitas configurar "}

  data: {"type":"text","delta":"`DATABASE_URL` y `DEEPSEEK_API_KEY` "}

  data: {"type":"text","delta":"(ver **[Setup.pdf](…) pág. 3**)."}

  event: done
  data: {"type":"done","stepCompleted":"step-2"}
  ```
- El frontend va concatenando los `delta` y renderiza el markdown (links a recursos incluidos). `stepCompleted` permite refrescar el progreso/UI.

> Nota Mastra: existen rutas de agente/stream integradas bajo `/api`, pero envolvemos `/chat` a medida para fijar el scope de memoria por token y simplificar el contrato del front.

## 5. CORS y errores

- `server.cors` con el origen del frontend (Claude Design / dominio Vercel).
- Modelo de error uniforme:
  ```jsonc
  { "error": { "code": "UNAUTHORIZED"|"FORBIDDEN"|"NOT_FOUND"|"BAD_REQUEST", "message": "..." } }
  ```
- `401` sin token / inválido · `403` rol u organización no permitidos · `404` recurso/ruta inexistente en la org · `400` payload inválido.

## 6. Criterios de aceptación

- Con un token de `admin` puedo subir un PDF y listar el catálogo; con uno de `user` no.
- Con un token de `user` puedo `GET /route`, `GET /progress`, `POST /chat` (stream) y `POST /resources/:id/open`.
- Un token de otra organización nunca ve recursos/ruta/progreso ajenos.
- El `/chat` responde en streaming y el front puede pintar el markdown con links.

## 7. Decisiones (cerradas)

- **D-6.1** Auth: JWT Bearer de Mastra con claims `{ sub, organizationId, role }`; `admin`=manager, `user`=learner.
- **D-6.2** Token de demo vía `POST /dev/login` (o tokens semilla); sin IdP/registro.
- **D-6.3** `/chat` por SSE con deltas de texto; citas y recomendaciones **embebidas como markdown** (sin canal estructurado en v1).
- **D-6.4** Contrato REST definido aquí; el frontend de Claude Design se adapta a él.

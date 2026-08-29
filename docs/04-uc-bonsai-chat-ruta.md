# UC4 — Bonsai (Chat) & Ruta de Onboarding

> Estado: `draft v0.1` · Depende de DOC 0, UC1, UC2, UC3. Es la experiencia central: el chat tipo Claude que guía al learner por la ruta y responde con RAG.

## 1. Objetivo

Un **chat conversacional tipo Claude** (streaming, en español) que actúa de _bonsai_: sabe en qué punto de la ruta de onboarding está el learner, lo guía al siguiente paso, le presenta los recursos (con detalles y enlaces), responde sus dudas con RAG **citando**, y gestiona el **completado** de cada paso.

## 2. Alcance

**In:**
- Agente bonsai (DeepSeek) con streaming vía SSE.
- **Ruta de onboarding precargada en JSON** (seed), **consultable** y de solo lectura.
- Guía proactiva por los pasos según el progreso del learner (UC5).
- Tres mecanismos de **completado** de paso: quiz, consumo de recurso, y evaluación de respuesta.
- Presentación de recursos: detalles + enlaces para consulta.
- Respuestas con RAG y **citación** de fuentes.
- **Recomendación de recursos fuera de la ruta**: cuando sea coherente con el contexto del learner, el bonsai sugiere otros recursos del catálogo (biblioteca de la plataforma), pudiendo incluso plantearlo como sugerencia/venta.

**Out:**
- CRUD de rutas por el manager (la ruta es seed JSON; editarla a mano es futuro).
- Embebido de reproductores de audio/vídeo dentro del chat (mostramos detalles + link).
- Multi-ruta o rutas condicionales por perfil.

**Stretch:**
- Que el bonsai proponga saltarse/reordenar pasos según el perfil.

## 3. Modelo de la ruta (seed JSON)

```jsonc
{
  "id": "route-acme-default",
  "organizationId": "acme",
  "title": "Onboarding Acme — Backend",
  "steps": [
    {
      "id": "step-1",
      "order": 1,
      "title": "Bienvenida y cultura",
      "objective": "Conocer la misión y valores de la empresa",
      "resourceIds": ["res-welcome-pdf"],
      "completion": { "type": "consume" }
    },
    {
      "id": "step-2",
      "order": 2,
      "title": "Setup del entorno",
      "objective": "Dejar el entorno de desarrollo listo",
      "resourceIds": ["res-setup-pdf"],
      "completion": {
        "type": "evaluation",
        "prompt": "Pregunta al learner qué pasos siguió para configurar el entorno",
        "rubric": "Debe mencionar clonar el repo, variables de entorno y arrancar el server"
      }
    },
    {
      "id": "step-3",
      "order": 3,
      "title": "Itinerario de seguridad",
      "objective": "Completar la learning experience de seguridad",
      "resourceIds": ["res-security-le"],
      "completion": { "type": "consume" }   // LE externa: completado al navegar la URL
    },
    {
      "id": "step-4",
      "order": 4,
      "title": "Quiz de repaso",
      "objective": "Validar lo aprendido",
      "resourceIds": ["res-handbook-pdf"],
      "completion": {
        "type": "quiz",
        "questions": [
          { "q": "¿Cada cuánto se rota la clave?", "options": ["...","..."], "answer": 1 }
        ],
        "passScore": 0.7
      }
    }
  ]
}
```

### Mecanismos de completado (B4)

| `completion.type` | Cómo se completa | Quién decide |
|---|---|---|
| `consume` | El learner consulta/navega el recurso (abre el PDF, navega la LE de la plataforma por URL) | Auto al registrar la consulta |
| `evaluation` | El learner responde una pregunta (p.ej. tras leer un PDF) y el bonsai **evalúa** su respuesta contra la `rubric` | DeepSeek (LLM) |
| `quiz` | El learner responde el quiz definido en el JSON; se aprueba si supera `passScore` | Sistema (comparación con `answer`) |

## 4. Comportamiento del bonsai

- **Arranque de sesión:** lee el progreso (UC5), saluda y sitúa al learner en su paso actual.
- **Por paso:** explica el `objective`, presenta el/los recursos (título, tipo, metadatos, **link**), y aplica el mecanismo de completado.
- **Dudas:** ante cualquier pregunta, usa `ragQueryTool` (UC3) y responde **citando** el recurso (y página si aplica).
- **Avance:** al completar un paso, actualiza progreso (UC5) y propone el siguiente.
- **Tono:** cercano, claro, en **español**; configurable por org a futuro.

## 5. Tools del agente bonsai

| Tool | Función |
|---|---|
| `ragQueryTool` | Recuperar contexto y citar (UC3), filtrado por org |
| `getRouteAndProgress` | Leer la ruta (seed JSON) + progreso del learner (UC5) |
| `presentResource` | Devolver detalles + enlace de un recurso del catálogo |
| `evaluateAnswer` | Evaluar la respuesta del learner contra la `rubric` (paso `evaluation`) |
| `gradeQuiz` | Corregir el quiz contra el JSON (paso `quiz`) |
| `markStepComplete` | Marcar paso completado + avanzar (escribe en UC5) |
| `recommendResources` | Buscar en el catálogo de la org recursos **coherentes** con el contexto y sugerirlos (incluye recursos fuera de la ruta; usa el retrieval de UC3) |

Modelo: `deepseek/deepseek-chat` para la conversación; `deepseek/deepseek-reasoner` recomendado para `evaluateAnswer` (razonamiento sobre la rúbrica).

## 6. API (contrato para el frontend de Claude Design)

| Endpoint | Método | Descripción |
|---|---|---|
| `/chat` | POST (SSE) | Mensaje del learner → respuesta del bonsai en **streaming** |
| `/route` | GET | Ruta de la org (solo lectura) |
| `/progress` | GET | Progreso del learner (UC5) |
| `/resources/:id/open` | POST | Registrar consulta de un recurso (dispara `consume`) |

El `/chat` recibe `{ message }` y resuelve `userId`/`organizationId`/`thread` del contexto de auth (UC1); responde con stream de texto + posibles referencias a recursos para que el front pinte tarjetas/links.

## 7. Flujo conversacional (ejemplo)

```
learner abre chat
  → bonsai: lee progreso → "Vas por el paso 2: Setup del entorno. Aquí tienes la guía 📄 [link]."
  → learner pregunta "¿qué variables necesito?"
  → bonsai: ragQueryTool → responde citando "Setup.pdf, pág. 3"
  → bonsai: "Cuando lo tengas, cuéntame qué pasos seguiste" (evaluation)
  → learner responde → evaluateAnswer (rúbrica) → markStepComplete → "¡Hecho! Siguiente: Seguridad 🔐 [link a la LE de la plataforma]"
```

## 8. Criterios de aceptación

- El bonsai **guía** al learner por la ruta sabiendo en qué paso está.
- Responde dudas con RAG **citando** la fuente.
- **Presenta recursos** con detalles y **enlaces** de consulta.
- Completa pasos por los **tres** mecanismos (consume, evaluation, quiz).
- Responde en **streaming** y en **español**.

## 9. Decisiones (cerradas)

- **D-4.1** El **quiz lo conduce el bonsai dentro del chat** (pregunta → respuesta), corregido contra el JSON.
- **D-4.2** La LE de la plataforma se da por **navegada/consumida al abrir el link**: el frontend llama a `/resources/:id/open` y eso dispara el `consume`.
- **D-4.3** El aprobado de `evaluation` lo decide el **LLM ("suficiente" según `rubric`)**, sin score numérico explícito.
- **D-4.4** La ruta **sugiere el orden pero no lo fuerza**: el learner puede preguntar/avanzar sobre cualquier paso.
- **D-4.5** Las referencias a recursos van como **markdown con links** dentro de la respuesta (sin canal estructurado en v1). Las tarjetas en Claude Design quedan como mejora futura.
- **D-4.6** El bonsai **recomienda recursos fuera de la ruta** cuando son **coherentes** con la conversación/perfil del learner, vía `recommendResources` sobre el catálogo de la org. Puede presentarlos como sugerencia de aprendizaje o como recomendación de biblioteca (upsell). Regla: la recomendación es **complementaria**, nunca sustituye ni desordena la ruta (D-4.4).

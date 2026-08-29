# UC1 — Organización & Identidad

> Estado: `draft v0.1` · Depende de DOC 0. Define el scoping multi-tenant, la auth y los roles. Es la base de permisos del resto de UCs.

## 1. Objetivo

Garantizar que **toda** interacción ocurre en el contexto de una organización (empresa) y de un rol, con la **autenticación mínima integrada de Mastra**. Sin organización resuelta, no hay acceso.

## 2. Alcance

**In (hackatón):**
- Una organización **sembrada** por config/seed.
- Dos roles: **manager** y **learner** (usuario en onboarding).
- Auth integrada de Mastra (sin IdP externo).
- Middleware de **org-scoping obligatorio** en todas las rutas de dominio.

**Out:**
- Alta self-service de organizaciones.
- UI/CRUD de superadmin (futuro).
- SSO / OAuth / IdP corporativo.
- Permisos finos por recurso (eso es stretch de UC2).

**Stretch:**
- Script de seed que cree org + 1 manager + 2 learners de ejemplo.

## 3. Actores

| Actor | Puede |
|---|---|
| **Manager** | Subir/conectar recursos, definir la ruta de onboarding, ver el catálogo |
| **Learner** | Chatear con el bonsai, ver su ruta y su progreso |
| **Superadmin** (futuro) | Crear organizaciones y managers |

## 4. Requisitos funcionales

- **RF-1.1** Cada request a una ruta de dominio debe resolver una `organizationId` válida; si no, **401/403**.
- **RF-1.2** El rol del usuario (`manager` | `learner`) determina los permisos (ver tabla §3).
- **RF-1.3** La auth es la integrada de Mastra; el token identifica al usuario y permite derivar `userId`, `organizationId` y `role`.
- **RF-1.4** El seed crea una organización y, al menos, un manager y un learner para poder demostrar ambos flujos.
- **RF-1.5** Ningún listado (recursos, ruta, progreso, chat) devuelve datos de otra organización.

## 5. Modelo de datos

```sql
organizations (
  id           uuid pk,
  name         text not null,
  config       jsonb default '{}',   -- branding, idioma por defecto, etc.
  created_at   timestamptz default now()
)

users (
  id              uuid pk,
  organization_id uuid not null references organizations(id),
  email           text not null,
  name            text,
  role            text not null check (role in ('manager','learner')),
  created_at      timestamptz default now(),
  unique (organization_id, email)
)
```

## 6. Flujos

**Resolución de contexto (cada request):**
```
request → auth Mastra valida token → { userId, organizationId, role }
        → middleware inyecta el contexto en el handler / agente
        → toda query lleva WHERE organization_id = :orgId
```

**Seed (arranque):**
```
seed → crea organization "Acme" → crea manager(acme) + learner(acme)
     → (UC2) precarga recursos mock → (UC4) ruta de ejemplo opcional
```

## 7. Decisiones técnicas

- **Auth:** mecanismo mínimo de Mastra (token/JWT del propio server). No montar IdP.
- **Org-scoping:** middleware en `registerApiRoute` + helper que toda tool/handler usa para obtener `organizationId`. Para los agentes, pasar `organizationId` por `runtimeContext` y propagarlo al filtro del RAG y al `resource` de memoria.
- **Single-org ahora:** si simplifica, la org puede venir de config mientras el claim del token no esté listo (ver OQ-1.1), pero el **código ya debe leer `organizationId` de contexto**, no hardcodearla en las queries.

## 8. Criterios de aceptación

- Un learner de la org Acme **no ve** recursos ni ruta de otra org (aunque solo haya una sembrada, la query debe filtrar por org).
- Un learner **no puede** acceder a endpoints de manager (subir recurso, editar ruta).
- Sin token válido → acceso denegado.

## 9. Decisiones (cerradas)

- **D-1.1** `organizationId` y `role` viajan como **claims del token** de auth de Mastra.
- **D-1.2** Los usuarios se crean **solo por seed** (sin endpoint de alta de learners en v1).
- **D-1.3** Solo dos roles: **manager** y **learner**. En el token de Mastra se representan como **`admin` (manager)** y **`user` (learner)**; el `role` viaja como claim y determina los permisos de §3.

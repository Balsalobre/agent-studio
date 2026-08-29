# Despliegue en Railway

El backend Mastra (`apps/mastra`) es un servidor Node que también **sirve el front
bonsai** (`apps/bonsai`) bajo la ruta `/app`. Un solo servicio de Railway = una sola URL.

## Cómo encaja todo

- `npm run build` → `mastra build` genera `.mastra/output/` y, en el hook `postbuild`,
  `scripts/sync-front.mjs` copia `apps/bonsai` a `.mastra/output/bonsai`.
- `npm run start` → `mastra start` arranca el server con `cwd = .mastra/output` y escucha
  en el `PORT` que inyecta Railway.
- `src/mastra/server/static.ts` sirve el front: `/` → redirige a `/app/`; `/app/*` sirve
  los estáticos desde `./bonsai`. Todas estas rutas son públicas (`requiresAuth: false`).
- El front detecta el API en el **mismo origen** en producción (ver `apiBase()` en
  `apps/bonsai/api.jsx`), así que no hay que configurar nada en el cliente.

La base de datos es **Postgres (Neon)**, externa a Railway — se reutiliza la misma que
en local. No se persiste nada en disco, así que **no hace falta volumen**.

## Pasos en Railway

1. **New Project → Deploy from GitHub repo** y elige este repositorio.
2. En el servicio, **Settings → Root Directory = `apps/mastra`**.
   (Railway clona el repo completo, así que `apps/bonsai` sigue accesible para el build.)
   El resto (builder Nixpacks, build y start commands, healthcheck `/hello`) ya viene
   definido en `apps/mastra/railway.json`.
3. **Variables** (Settings → Variables) — copia desde tu `.env` local:
   - `DEEPSEEK_API_KEY`
   - `OPENAI_API_KEY`
   - `JWT_SECRET`
   - `DATABASE_URL`  (la cadena de Neon)
   - `DATABASE_URL_UNPOOLED`  (opcional; si falta, usa `DATABASE_URL`)
   - `MASTRA_PLATFORM_ACCESS_TOKEN`, `MASTRA_PROJECT_ID`  (opcionales, observabilidad)
   - **NO** definas `PORT` — Railway lo inyecta solo.
4. **Deploy.** Railway expone una URL pública (Settings → Networking → Generate Domain).

## Acceso

- Front: `https://<tu-servicio>.railway.app/app/`  (la raíz `/` redirige ahí).
- API:   `https://<tu-servicio>.railway.app/api` + rutas custom (`/chat`, `/dev/login`, …).

## Notas

- **Migraciones**: se reutiliza la BD de Neon, que ya tiene el esquema aplicado. Si
  algún día despliegas contra una BD vacía, corre `npx prisma migrate deploy` una vez.
- Si el front diera 404 en `/app/` tras desplegar, significa que `apps/bonsai` no llegó
  al checkout del build; en ese caso commitea la copia o mueve el front dentro de
  `apps/mastra`.
- En local nada cambia: backend con `cd apps/mastra && npm run dev` (`:4111`) y el front
  estático con `cd apps/bonsai && python3 -m http.server 5500` → `:5500/index.html`.

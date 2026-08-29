import { registerApiRoute } from "@mastra/core/server";
import { serveStatic } from "@hono/node-server/serve-static";

// Serves the bonsai static front (apps/bonsai) from the same Mastra server.
//
// In production `mastra start` runs the bundled server with cwd = .mastra/output,
// and the `postbuild` script (scripts/sync-front.mjs) copies the front into
// .mastra/output/bonsai — hence root "./bonsai" below. All routes are public
// (requiresAuth: false); the front authenticates API calls with Bearer tokens.
//
// Mounted under /app (not /) so it never collides with the reserved /api prefix
// or the built-in Mastra routes. "/" redirects to /app/ for convenience.
const FRONT_ROOT = "./bonsai";

const serveFront = serveStatic({
  root: FRONT_ROOT,
  // Strip the /app mount prefix; "" maps to the directory index (index.html).
  rewriteRequestPath: (path) => path.replace(/^\/app\/?/, "/"),
});

// Root redirect to the bonsai front. Exported separately so it can be omitted
// in local Studio mode (STUDIO_OPEN_AUTH=true), where `mastra dev` serves the
// Studio SPA at "/" and this redirect would otherwise shadow it.
export const rootRedirectRoute = registerApiRoute("/", {
  method: "GET",
  requiresAuth: false,
  handler: (c) => c.redirect("/app/"),
});

// Static assets and the SPA entry. The wildcard lives under /app, so it stays
// clear of /api/* and the custom API routes (/chat, /dev/login, /resources...).
const serveAppAssets = registerApiRoute("/app/*", {
  method: "GET",
  requiresAuth: false,
  middleware: [serveFront],
  handler: (c) => c.notFound(),
});

const serveAppRoot = registerApiRoute("/app", {
  method: "GET",
  requiresAuth: false,
  handler: (c) => c.redirect("/app/"),
});

// In local Studio mode, drop the "/" redirect so the Studio SPA stays reachable
// at the root; the bonsai front is still served at /app either way.
const studioOpenAuth = process.env.STUDIO_OPEN_AUTH === "true";

export const staticRoutes = studioOpenAuth
  ? [serveAppRoot, serveAppAssets]
  : [rootRedirectRoute, serveAppRoot, serveAppAssets];

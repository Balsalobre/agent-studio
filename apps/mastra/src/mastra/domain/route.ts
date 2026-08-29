import type { Route, RouteStep } from "./types";
import acmeOrgRoute from "../seed/routes/acme-org.json";

// Routes are seeded JSON, read-only. We import them statically so the
// bundle (mastra dev / mastra build) always finds them — relying on
// runtime filesystem lookups breaks under the Vercel deployer output.
const ROUTES: Record<string, Route> = {
  "acme-org": acmeOrgRoute as Route,
};

export async function getRouteForOrg(organizationId: string): Promise<Route | null> {
  return ROUTES[organizationId] ?? null;
}

export function findStep(route: Route, stepId: string): RouteStep | null {
  return route.steps.find((s) => s.id === stepId) ?? null;
}

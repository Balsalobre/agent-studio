import { prisma } from "./prisma";
import { getRouteForOrg } from "./route";
import { toResourceDTO } from "./resources";
import type { ResourceDTO, Route, RouteStep } from "./types";

export type StepWithStatus = {
  step: RouteStep;
  status: "pending" | "in_progress" | "completed";
};

export type RouteProgressSnapshot = {
  route: Route | null;
  steps: StepWithStatus[];
  doneCount: number;
  totalCount: number;
  /** First non-completed step by order, or null when the route is finished. */
  currentStep: RouteStep | null;
  /** Most recently completed step by order, or null when nothing is done. */
  lastCompletedStep: RouteStep | null;
};

// Shared route+progress reader used by the workflows. The get-route-and-progress
// tool computes the same shape inline for the agent; this function is the
// reusable version the workflow steps call directly with an explicit org/user
// (no RequestContext needed inside a workflow step).
export async function getRouteProgressSnapshot(
  organizationId: string,
  userId: string,
): Promise<RouteProgressSnapshot> {
  const route = await getRouteForOrg(organizationId);
  if (!route) {
    return {
      route: null,
      steps: [],
      doneCount: 0,
      totalCount: 0,
      currentStep: null,
      lastCompletedStep: null,
    };
  }

  const progressRows = await prisma.learnerProgress.findMany({
    where: { organizationId, userId, routeId: route.id },
    select: { stepId: true, status: true },
  });
  const byStep = new Map(progressRows.map((p) => [p.stepId, p.status]));

  const ordered = [...route.steps].sort((a, b) => a.order - b.order);
  const steps: StepWithStatus[] = ordered.map((step) => ({
    step,
    status: (byStep.get(step.id) ?? "pending") as StepWithStatus["status"],
  }));

  const doneCount = steps.filter((s) => s.status === "completed").length;
  const currentStep = steps.find((s) => s.status !== "completed")?.step ?? null;
  const completed = steps.filter((s) => s.status === "completed");
  const lastCompletedStep = completed.length
    ? completed[completed.length - 1]!.step
    : null;

  return {
    route,
    steps,
    doneCount,
    totalCount: steps.length,
    currentStep,
    lastCompletedStep,
  };
}

// Fetch full DTOs for a set of resource ids in an org (order preserved).
export async function getResourcesByIds(
  organizationId: string,
  ids: string[],
): Promise<ResourceDTO[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.resource.findMany({
    where: { organizationId, id: { in: ids } },
  });
  const byId = new Map(rows.map((r) => [r.id, toResourceDTO(r)]));
  return ids.map((id) => byId.get(id)).filter((r): r is ResourceDTO => Boolean(r));
}

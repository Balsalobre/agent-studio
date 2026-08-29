import { prisma } from "./prisma";
import { getRouteForOrg } from "./route";

// Risk thresholds (demo heuristics).
const RISK_INACTIVE_DAYS = 5;
const RISK_LOW_PCT = 20;

export type TeamMember = {
  userId: string;
  name: string;
  routeTitle: string;
  pct: number; // 0..100
  completedSteps: number;
  totalSteps: number;
  trend7d: number; // delta points over the last 7 days
  lastActiveDays: number; // days since last activity
  risk: boolean;
  /** true when the row is real DB data, false for the demo roster. */
  live: boolean;
};

export type RouteOption = { title: string; focus: string; people: number; pct: number };

export type TeamSnapshot = {
  routeTitle: string;
  totalSteps: number;
  members: TeamMember[];
  catalog: RouteOption[];
};

// Demo roster layered on top of the real learner so the manager workflows have
// a believable team to reason about. The single seeded learner ("Ana Torres")
// is computed live from learner_progress; these teammates are synthetic.
const SYNTHETIC: Array<Omit<TeamMember, "totalSteps" | "routeTitle" | "completedSteps">> = [
  { userId: "syn-carlos", name: "Carlos Vidal", pct: 86, trend7d: 12, lastActiveDays: 0, risk: false, live: false },
  { userId: "syn-lucia", name: "Lucía Méndez", pct: 64, trend7d: 5, lastActiveDays: 1, risk: false, live: false },
  { userId: "syn-marta", name: "Marta Ríos", pct: 41, trend7d: 8, lastActiveDays: 0, risk: false, live: false },
  { userId: "syn-diego", name: "Diego Salas", pct: 23, trend7d: -2, lastActiveDays: 6, risk: true, live: false },
  { userId: "syn-aroa", name: "Aroa Pérez", pct: 12, trend7d: 0, lastActiveDays: 9, risk: true, live: false },
];

const CATALOG: RouteOption[] = [
  { title: "Onboarding · Banca (Compliance y Herramientas)", focus: "incorporación", people: 14, pct: 78 },
  { title: "Liderazgo de equipos", focus: "desarrollo de mandos", people: 9, pct: 52 },
  { title: "Excel avanzado para producto", focus: "datos", people: 6, pct: 24 },
];

const isRisk = (pct: number, lastActiveDays: number) =>
  lastActiveDays >= RISK_INACTIVE_DAYS || pct < RISK_LOW_PCT;

function daysSince(date: Date | null | undefined): number {
  if (!date) return 99;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

// Build a team snapshot for the manager workflows: the real learner(s) from the
// DB plus a synthetic roster, all scored against the org's route.
export async function getTeamSnapshot(organizationId: string): Promise<TeamSnapshot> {
  const route = await getRouteForOrg(organizationId);
  const totalSteps = route?.steps.length ?? 0;
  const routeTitle = route?.title ?? "Ruta de onboarding";

  const members: TeamMember[] = [];

  // Real learners in the org, scored from their progress rows.
  const learners = await prisma.user.findMany({
    where: { organizationId, role: "learner" },
    select: { id: true, name: true, email: true },
  });

  for (const u of learners) {
    const rows = route
      ? await prisma.learnerProgress.findMany({
          where: { organizationId, userId: u.id, routeId: route.id },
          select: { status: true, updatedAt: true },
        })
      : [];
    const completedSteps = rows.filter((r) => r.status === "completed").length;
    const pct = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const lastActive = rows.reduce<Date | null>(
      (acc, r) => (!acc || r.updatedAt > acc ? r.updatedAt : acc),
      null,
    );
    const lastActiveDays = daysSince(lastActive);
    members.push({
      userId: u.id,
      name: u.name ?? u.email,
      routeTitle,
      pct,
      completedSteps,
      totalSteps,
      trend7d: completedSteps > 0 ? Math.min(completedSteps * 3, 15) : 0,
      lastActiveDays,
      risk: isRisk(pct, lastActiveDays),
      live: true,
    });
  }

  // Layer the synthetic roster on top (skip names that already exist live).
  const liveNames = new Set(members.map((m) => m.name.toLowerCase()));
  for (const s of SYNTHETIC) {
    if (liveNames.has(s.name.toLowerCase())) continue;
    members.push({
      ...s,
      routeTitle,
      totalSteps,
      completedSteps: totalSteps ? Math.round((s.pct / 100) * totalSteps) : 0,
    });
  }

  // Most-at-risk first: longest inactivity, then lowest progress.
  members.sort((a, b) => b.lastActiveDays - a.lastActiveDays || a.pct - b.pct);

  return { routeTitle, totalSteps, members, catalog: CATALOG };
}

export function aggregateTeamKpis(snapshot: TeamSnapshot) {
  const { members } = snapshot;
  const size = members.length || 1;
  const avgProgress = Math.round(members.reduce((s, m) => s + m.pct, 0) / size);
  const atRisk = members.filter((m) => m.risk);
  const completed = members.filter((m) => m.pct >= 100).length;
  const topMover = [...members].sort((a, b) => b.trend7d - a.trend7d)[0] ?? null;
  const laggard = [...members].sort((a, b) => a.pct - b.pct)[0] ?? null;
  return {
    teamSize: members.length,
    avgProgress,
    atRiskCount: atRisk.length,
    completedCount: completed,
    topMover,
    laggard,
  };
}

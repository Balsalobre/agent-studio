import type {
  Role as PrismaRole,
  ResourceType as PrismaResourceType,
  ResourceStatus as PrismaResourceStatus,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";

// Domain role names (manager/learner) — what we use in code and DB.
export type Role = PrismaRole; // 'manager' | 'learner'

// JWT role names per D-1.3 / D-6.1: admin = manager, user = learner.
export type TokenRole = "admin" | "user";

export const tokenRoleToDomain = (r: TokenRole): Role =>
  r === "admin" ? "manager" : "learner";

export const domainRoleToToken = (r: Role): TokenRole =>
  r === "manager" ? "admin" : "user";

export type ResourceType = PrismaResourceType;
export type ResourceStatus = PrismaResourceStatus;
export type ProgressStatus = PrismaProgressStatus;

export type ResourceSource = {
  url?: string;
  filename?: string;
  provider?: string;
};

export type ResourceMetadata = {
  description?: string;
  author?: string;
  tags?: string[];
  level?: "intro" | "intermedio" | "avanzado";
  language?: string;
  pages?: number;
  durationSec?: number;
  /** Optional cover/thumbnail image URL for the resource. */
  image?: string;
};

export type ResourceDTO = {
  id: string;
  organizationId: string;
  type: ResourceType;
  title: string;
  status: ResourceStatus;
  source: ResourceSource;
  metadata: ResourceMetadata;
};

export type LearnerProgressDTO = {
  routeId: string;
  stepId: string;
  status: ProgressStatus;
  evidence?: Record<string, unknown>;
  completedAt?: string;
};

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
};

export type RouteStep = {
  id: string;
  order: number;
  title: string;
  objective: string;
  resourceIds: string[];
  completion:
    | { type: "consume" }
    | { type: "evaluation"; prompt: string; rubric: string }
    | { type: "quiz"; questions: QuizQuestion[]; passScore: number };
};

export type Route = {
  id: string;
  organizationId: string;
  title: string;
  steps: RouteStep[];
};

// Resolved auth context attached to each authed request.
export type RequestCtx = {
  userId: string;
  organizationId: string;
  role: Role;
};

// JWT claims per DOC 06.
export type JwtClaims = {
  sub: string;
  organizationId: string;
  role: TokenRole;
  iat?: number;
  exp?: number;
};

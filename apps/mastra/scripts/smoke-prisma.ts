// Smoke test: confirm Prisma client + PrismaPg adapter connect and queries work.
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(import.meta.dir, "..", ".env") });

const { prisma } = await import("../src/mastra/domain/prisma");

const orgs = await prisma.organization.count();
const users = await prisma.user.count();
const resources = await prisma.resource.count();
const progress = await prisma.learnerProgress.count();

console.log({ orgs, users, resources, progress });

await prisma.$disconnect();

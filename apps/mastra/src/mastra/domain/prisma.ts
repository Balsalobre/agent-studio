import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../env";

declare global {
  // eslint-disable-next-line no-var
  var __prismaSingleton: PrismaClient | undefined;
}

function build(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalThis.__prismaSingleton ?? build();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaSingleton = prisma;
}

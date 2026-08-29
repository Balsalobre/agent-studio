import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Locate the nearest .env walking up from this file. Mastra's dev/build
// pipelines don't auto-load .env, and process.cwd() varies (project root vs
// apps/mastra/), so we resolve it deterministically.
function findEnvFile(): string | undefined {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

const envPath = findEnvFile();
if (envPath) loadDotenv({ path: envPath, quiet: true });


function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const env = {
  // LLM providers
  deepseekApiKey: requireEnv("DEEPSEEK_API_KEY"),
  openaiApiKey: requireEnv("OPENAI_API_KEY"),

  // Database
  databaseUrl: requireEnv("DATABASE_URL"),
  databaseUrlUnpooled: optionalEnv("DATABASE_URL_UNPOOLED") ?? requireEnv("DATABASE_URL"),

  // Auth (HS256 shared secret used by both MastraJwtAuth verifier and jose signer)
  jwtSecret: requireEnv("JWT_SECRET"),
};

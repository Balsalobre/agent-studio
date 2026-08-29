// sync-front.mjs — copies the bonsai static front into the built Mastra output
// so the production server (`mastra start`) can serve it from disk.
//
// Why this exists:
//   `mastra start` spawns the bundled server with cwd = .mastra/output, and the
//   serveStatic middleware (src/mastra/server/static.ts) reads files from
//   `./bonsai` relative to that cwd. `mastra build` regenerates .mastra/output
//   from scratch, so this must run AFTER the build (npm `postbuild` lifecycle).
//
// Source of truth stays apps/bonsai — nothing is committed under .mastra/output.
import { cp, mkdir, rename, access, rm, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url)); // apps/mastra/scripts
const SRC = resolve(scriptDir, "../../bonsai"); // apps/bonsai
const DEST = resolve(scriptDir, "../.mastra/output/bonsai"); // .mastra/output/bonsai

// Heavy / irrelevant dirs that should never ship with the front bundle.
const EXCLUDE_DIRS = new Set(["screenshots", "uploads", "node_modules"]);
// Editor/version junk files that aren't real assets (e.g. "chat.jsx?v=5").
const isJunk = (name) => name.includes("?v=");

if (!existsSync(SRC)) {
  console.warn(`[sync-front] source not found at ${SRC} — skipping (front won't be served)`);
  process.exit(0);
}
if (!existsSync(resolve(scriptDir, "../.mastra/output"))) {
  console.warn(`[sync-front] .mastra/output missing — run \`mastra build\` first. Skipping.`);
  process.exit(0);
}

await rm(DEST, { recursive: true, force: true });
await mkdir(DEST, { recursive: true });

await cp(SRC, DEST, {
  recursive: true,
  filter: (source) => {
    const rel = source.slice(SRC.length + 1);
    if (!rel) return true;
    const top = rel.split("/")[0];
    if (EXCLUDE_DIRS.has(top)) return false;
    const base = rel.split("/").pop();
    if (isJunk(base)) return false;
    return true;
  },
});

// The HTML entry has a space in its name; serveStatic needs index.html at root.
const entry = resolve(DEST, "index.html");
try {
  await access(entry);
  await rename(entry, resolve(DEST, "index.html"));
} catch {
  console.warn(`[sync-front] "index.html" not found — no index.html created`);
}

console.log(`[sync-front] front copied to ${DEST}`);

// Optionally enable the full Mastra Studio on the deployed server. The bundled
// entry hardcodes `studio: false` (so `mastra start` serves only the info page);
// flipping it to true mounts the Studio SPA at "/". Gated on STUDIO_OPEN_AUTH so
// it travels together with the open-auth runtime switch (src/mastra/index.ts) —
// the Studio's /api/* calls would 401 otherwise. ⚠️ Both make the server's
// built-in routes (agents, workflows, observability, memory) PUBLIC.
if (process.env.STUDIO_OPEN_AUTH === "true") {
  // `mastra build` (without --studio) generates the entry with `studio: false`
  // AND skips copying the Studio SPA assets. Replicate `--studio` here: copy the
  // assets from the installed mastra package and flip the flag.
  const studioSrc = resolve(scriptDir, "../node_modules/mastra/dist/studio");
  const studioDest = resolve(scriptDir, "../.mastra/output/studio");
  try {
    if (existsSync(studioSrc)) {
      await rm(studioDest, { recursive: true, force: true });
      await cp(studioSrc, studioDest, { recursive: true });
      console.log(`[sync-front] copied Studio assets → ${studioDest}`);
    } else {
      console.warn(`[sync-front] Studio assets not found at ${studioSrc}`);
    }
  } catch (e) {
    console.warn(`[sync-front] could not copy Studio assets: ${e.message}`);
  }

  const entryFile = resolve(scriptDir, "../.mastra/output/index.mjs");
  try {
    const src = await readFile(entryFile, "utf-8");
    if (src.includes("studio: false")) {
      await writeFile(entryFile, src.replace(/studio: false/g, "studio: true"));
      console.log(`[sync-front] STUDIO_OPEN_AUTH=true → enabled Mastra Studio in ${entryFile}`);
    } else {
      console.warn(`[sync-front] STUDIO_OPEN_AUTH=true but "studio: false" not found — Studio may already be on or the bundle layout changed`);
    }
  } catch (e) {
    console.warn(`[sync-front] could not patch studio flag: ${e.message}`);
  }
}

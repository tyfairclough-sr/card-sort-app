import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// #region agent log
function envConfigured(name) {
  if (process.env[name]?.trim()) return true;
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return false;
  try {
    const text = readFileSync(p, "utf8");
    return new RegExp(`^\\s*${name}\\s*=`, "m").test(text);
  } catch {
    return false;
  }
}

const payload = {
  sessionId: "6d6039",
  runId: process.env.DEBUG_RUN_ID ?? "pre-fix",
  hypothesisId: "H1",
  location: "scripts/agent-debug-build-env.mjs",
  message: "build env snapshot (configured, not values)",
  data: {
    databaseUrlConfigured: envConfigured("DATABASE_URL"),
    directUrlConfigured: envConfigured("DIRECT_URL"),
    vercel: Boolean(process.env.VERCEL),
    ci: Boolean(process.env.CI),
  },
  timestamp: Date.now(),
};
fetch("http://127.0.0.1:7365/ingest/345c03df-164c-462c-b9fd-aedb0c58d525", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "6d6039",
  },
  body: JSON.stringify(payload),
}).catch(() => {});
// #endregion

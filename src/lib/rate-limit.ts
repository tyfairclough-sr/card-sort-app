type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

function prune() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

/** Simple in-memory limiter; suitable for single-node dev/small deploys. */
export function rateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  prune();
  const now = Date.now();
  let e = store.get(key);
  if (!e || e.resetAt < now) {
    e = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, e);
    return { ok: true };
  }
  e.count += 1;
  if (e.count > MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((e.resetAt - now) / 1000) };
  }
  return { ok: true };
}

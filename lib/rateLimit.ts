const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 20; // per IP, per window

interface Bucket {
  count: number;
  resetAt: number;
}

// Best-effort, in-memory per-instance limiter. Vercel may run multiple
// lambda instances, so this caps abuse rather than enforcing an exact
// global limit — enough to stop a single client from burning the Gemini
// quota without adding external infra (Redis/KV).
const buckets = new Map<string, Bucket>();
let callsSinceSweep = 0;

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();

  callsSinceSweep++;
  if (callsSinceSweep >= 200) {
    callsSinceSweep = 0;
    sweepExpired(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true };
}

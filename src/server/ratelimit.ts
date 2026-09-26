import { prisma } from "@/server/db";

// Simple in-memory sliding window rate limiter (per process).
// For multi-instance prod, swap with Redis. Keeps the interface stable.

type Bucket = { count: number; reset: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

export function rateLimitHeaders(res: Response, r: RateLimitResult, limit: number): Response {
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(r.remaining));
  if (!r.ok) res.headers.set("Retry-After", String(r.retryAfter));
  return res;
}

/** Rate limit keyed by IP for NextRequest. */
export function ipRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  return rateLimit(`${scope}:${ip}`, limit, windowMs);
}

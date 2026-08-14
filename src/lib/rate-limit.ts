import "server-only";

/**
 * Fixed-window rate limiter held in process memory.
 *
 * Deliberately dependency-free — the contact form is the only writable
 * endpoint on the site and its traffic is tiny. The trade-off: the counter is
 * per server instance, so on a multi-instance or serverless deployment the
 * effective limit is `max × instances`. Move to Redis/Upstash if the site is
 * ever scaled out or starts attracting real abuse.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

/** Drop expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
  for (const [key, bucket] of hits) {
    if (bucket.resetAt <= now) hits.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets — surfaced as `Retry-After`. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  if (hits.size > 500) sweep(now);

  const bucket = hits.get(key);

  if (!bucket || bucket.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort client address. `x-forwarded-for` is only trustworthy behind a
 * proxy that overwrites it; treat this as abuse dampening, not identity.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

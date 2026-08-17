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
 * Bucket every request that cannot be attributed to a caller shares. Anything
 * unattributable competes for one budget rather than getting a private one.
 */
export const SHARED_KEY = "unattributed";

/** The whole-site backstop, counted regardless of how a request is keyed. */
export const GLOBAL_KEY = "global";

/**
 * Client identity for rate limiting.
 *
 * `x-forwarded-for` is a plain request header: anyone can set it, and a fresh
 * value per request means a fresh bucket per request — which is a rate limiter
 * that never limits. It is trustworthy *only* when a reverse proxy in front of
 * this app overwrites it, so it is read only when the deployment says one does,
 * via `TRUST_PROXY`.
 *
 * Node gives a route handler no access to the socket address, so there is no
 * safer per-caller signal to fall back to. Untrusted deployments therefore put
 * everyone in one shared bucket — coarse, but a limit that actually holds. The
 * global backstop in the route covers both cases.
 */
export function clientKey(request: Request): string {
  const trustProxy = /^(1|true)$/i.test(process.env.TRUST_PROXY?.trim() ?? "");
  if (!trustProxy) return SHARED_KEY;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || SHARED_KEY;
}

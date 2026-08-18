import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RateLimitModule = typeof import("@/lib/rate-limit");

/**
 * The limiter keeps its buckets in module scope, so every test imports a fresh
 * copy (the setup file resets the registry) rather than inheriting counters.
 */
const load = () => import("@/lib/rate-limit") as Promise<RateLimitModule>;

const WINDOW = { max: 3, windowMs: 60_000 };

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows exactly `max` calls inside one window", async () => {
    const { rateLimit } = await load();

    for (let i = 1; i <= WINDOW.max; i += 1) {
      expect(rateLimit("caller", WINDOW), `call ${i}`).toEqual({
        allowed: true,
        retryAfter: 0,
      });
    }
  });

  it("blocks the call after `max` and reports whole seconds until reset", async () => {
    const { rateLimit } = await load();

    for (let i = 0; i < WINDOW.max; i += 1) rateLimit("caller", WINDOW);

    vi.advanceTimersByTime(10_000); // 50s left in the window
    expect(rateLimit("caller", WINDOW)).toEqual({
      allowed: false,
      retryAfter: 50,
    });
  });

  it("rounds a partial second up, never to zero", async () => {
    const { rateLimit } = await load();

    for (let i = 0; i < WINDOW.max; i += 1) rateLimit("caller", WINDOW);

    // 1ms before the window closes — `Retry-After: 0` would invite an
    // immediate retry that is still blocked.
    vi.advanceTimersByTime(WINDOW.windowMs - 1);
    expect(rateLimit("caller", WINDOW).retryAfter).toBe(1);
  });

  it("starts a fresh window once the old one has expired", async () => {
    const { rateLimit } = await load();

    for (let i = 0; i < WINDOW.max; i += 1) rateLimit("caller", WINDOW);
    expect(rateLimit("caller", WINDOW).allowed).toBe(false);

    vi.advanceTimersByTime(WINDOW.windowMs);
    expect(rateLimit("caller", WINDOW)).toEqual({ allowed: true, retryAfter: 0 });
  });

  it("is a fixed window, not a sliding one: the budget resets wholesale", async () => {
    const { rateLimit } = await load();

    for (let i = 0; i < WINDOW.max; i += 1) rateLimit("caller", WINDOW);
    vi.advanceTimersByTime(WINDOW.windowMs);

    // The full budget is available again immediately, not one slot at a time.
    for (let i = 0; i < WINDOW.max; i += 1) {
      expect(rateLimit("caller", WINDOW).allowed).toBe(true);
    }
    expect(rateLimit("caller", WINDOW).allowed).toBe(false);
  });

  it("keeps a separate budget per key", async () => {
    const { rateLimit } = await load();

    for (let i = 0; i < WINDOW.max; i += 1) rateLimit("a", WINDOW);
    expect(rateLimit("a", WINDOW).allowed).toBe(false);
    expect(rateLimit("b", WINDOW).allowed).toBe(true);
  });

  it("sweeps expired buckets so the map cannot grow without bound", async () => {
    const { rateLimit } = await load();

    // 501 distinct keys puts the map over the sweep threshold.
    for (let i = 0; i < 501; i += 1) rateLimit(`ip-${i}`, WINDOW);

    // Every bucket above is now stale; the next call triggers the sweep.
    vi.advanceTimersByTime(WINDOW.windowMs + 1);
    expect(rateLimit("fresh", WINDOW).allowed).toBe(true);

    // The swept keys behave as never-seen: a full budget, not a blocked one.
    for (let i = 0; i < WINDOW.max; i += 1) {
      expect(rateLimit("ip-0", WINDOW).allowed).toBe(true);
    }
  });
});

describe("clientKey", () => {
  const request = (headers: Record<string, string> = {}) =>
    new Request("https://example.com/api/contact", { headers });

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("puts everyone in the shared bucket when the proxy is not trusted", async () => {
    const { clientKey, SHARED_KEY } = await load();

    // The header is present *and* forgeable — the point of the flag is that it
    // is ignored until the deployment says a proxy overwrites it.
    expect(clientKey(request({ "x-forwarded-for": "1.2.3.4" }))).toBe(SHARED_KEY);
  });

  it.each(["1", "true", "TRUE", "True", " true "])(
    "trusts the proxy when TRUST_PROXY=%j",
    async (flag) => {
      vi.stubEnv("TRUST_PROXY", flag);
      const { clientKey } = await load();

      expect(clientKey(request({ "x-forwarded-for": "1.2.3.4" }))).toBe("1.2.3.4");
    },
  );

  it.each(["0", "false", "yes", "no", ""])(
    "does not trust the proxy when TRUST_PROXY=%j",
    async (flag) => {
      vi.stubEnv("TRUST_PROXY", flag);
      const { clientKey, SHARED_KEY } = await load();

      expect(clientKey(request({ "x-forwarded-for": "1.2.3.4" }))).toBe(SHARED_KEY);
    },
  );

  it("takes the left-most hop from a chained x-forwarded-for", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const { clientKey } = await load();

    expect(
      clientKey(request({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 10.0.0.2" })),
    ).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const { clientKey } = await load();

    expect(clientKey(request({ "x-real-ip": " 5.6.7.8 " }))).toBe("5.6.7.8");
  });

  it("falls back to the shared bucket when a trusted proxy sends no address", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const { clientKey, SHARED_KEY } = await load();

    expect(clientKey(request())).toBe(SHARED_KEY);
    expect(clientKey(request({ "x-real-ip": "   " }))).toBe(SHARED_KEY);
  });

  it("keeps the shared and global buckets distinct", async () => {
    const { SHARED_KEY, GLOBAL_KEY } = await load();

    // They are counted against different limits in the route; sharing a string
    // would silently merge the per-caller and site-wide budgets.
    expect(SHARED_KEY).not.toBe(GLOBAL_KEY);
  });
});

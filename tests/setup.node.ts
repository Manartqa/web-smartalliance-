import { beforeEach, vi } from "vitest";

/**
 * `rate-limit` and `mail/client` both hold module-level state (the hit map, the
 * cached transporter). Resetting the registry before every test means each one
 * starts from a cold module rather than inheriting counters from the last.
 */
beforeEach(() => {
  vi.resetModules();
});

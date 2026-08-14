/**
 * Validation shared by the client form and the route handler, so the two can
 * never drift apart. Lives in `lib/` rather than a partial's config because the
 * server side must not reach into `components/`.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

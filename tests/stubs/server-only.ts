/**
 * `server-only` exists to make a build fail when server code is pulled into a
 * client bundle. Under Vitest there is no such bundle, so importing the real
 * package throws and the module under test can never be loaded. This stub is
 * aliased in its place (see `vitest.config.ts`).
 */
export {};

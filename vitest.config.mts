import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Two projects, because this repo has two kinds of unit under test.
 *
 * `node` — route handlers, mail, secrets, rate limiting. These import
 * `server-only`, which throws by design when bundled for the browser; the alias
 * below stubs it so the module can be imported directly by a test.
 *
 * `jsdom` — the one client component with logic in it (`ContactForm`) and the
 * hooks it uses. Kept separate so the server tests are not paying for a DOM.
 */
const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  "server-only": fileURLToPath(
    new URL("./tests/stubs/server-only.ts", import.meta.url),
  ),
};

export default defineConfig({
  test: {
    // A route handler mutates module-level rate-limit state, and `readMailConfig`
    // reads `process.env`. Threads share neither, but the default file-level
    // parallelism still interleaves them within a worker, so each test file gets
    // its own module registry via `restoreMocks`/`resetModules` in setup.
    restoreMocks: true,
    clearMocks: true,
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          setupFiles: ["./tests/setup.node.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.tsx"],
          setupFiles: ["./tests/setup.dom.ts"],
          server: {
            // next-intl's ESM build imports `next/navigation` without a file
            // extension, and Next 16's package.json declares no `exports` map —
            // so Node's ESM resolver, which Vitest uses for externalised deps,
            // cannot resolve it. Inlining hands the import to Vite's resolver
            // instead, which fills the extension in.
            deps: { inline: ["next-intl"] },
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Only the code these tests are meant to cover. Pages, layouts and the
      // presentational partials are render-only wiring; they are covered by
      // `next build` type-checking and by looking at the site, not by asserting
      // on their JSX.
      include: [
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
        "src/app/api/**/*.ts",
        "src/components/partials/Contact/ContactForm.tsx",
      ],
      exclude: ["src/lib/fonts.ts", "**/index.ts"],
      // Set just under what the suite currently achieves (98.7 / 98.7 / 95.2 /
      // 98.9), so a change that drops coverage fails CI rather than eroding it
      // quietly. Raise them if the suite is extended; do not lower them to make
      // a build pass.
      thresholds: {
        lines: 95,
        functions: 92,
        branches: 95,
        statements: 95,
      },
    },
  },
});

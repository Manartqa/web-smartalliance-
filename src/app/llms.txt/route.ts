import { buildLlmsTxt } from "@/lib/llms-txt";

/**
 * Serves `/llms.txt`.
 *
 * `force-static` prerenders it at build time like `sitemap.xml` and
 * `robots.txt` — the content is derived from message files, so there is nothing
 * to recompute per request.
 *
 * The proxy matcher skips any path containing a dot, so this is not swallowed
 * by the locale redirect and stays reachable at the root, which is the only
 * place the convention is looked for.
 */
export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next.js 16 renamed the `middleware` convention to `proxy`.
// next-intl still ships the handler factory under its old name.
export const proxy = createMiddleware(routing);

export default proxy;

export const config = {
  // Skip API routes, Next internals and anything with a file extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

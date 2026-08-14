import axios from "axios";

import { attachInterceptors } from "./interceptor";

/**
 * Axios instance for the site's own route handlers (`/api/*`).
 *
 * `baseURL` stays empty by default so calls resolve same-origin in the browser.
 * Set `NEXT_PUBLIC_API_BASE_URL` when the frontend has to talk to a backend on
 * another host.
 */
export const mainClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

attachInterceptors(mainClient);

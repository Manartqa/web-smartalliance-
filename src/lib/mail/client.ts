import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { readSecret } from "@/lib/secrets";

import { getAccessToken, SCOPE, type OAuthConfig } from "./oauth";

/**
 * Mail configuration, read from the environment.
 *
 * Two transports, chosen by what the environment provides:
 *
 * - **graph** — Microsoft Graph `sendMail`. The default whenever Entra
 *   credentials are present, because the App Registration on this tenant holds
 *   `Mail.Send` and nothing further is needed.
 * - **smtp** — nodemailer, authenticating with XOAUTH2 or a password. Set
 *   `MAIL_TRANSPORT=smtp` to force it; a password alone also selects it.
 *
 * Basic Authentication is blocked tenant-wide by Security Defaults here, so a
 * password login fails with `535 5.7.139 … locked by your organization's
 * security defaults policy`. It stays supported for other mail servers.
 *
 * Everything is server-only — no `NEXT_PUBLIC_` prefix, so none of it reaches
 * the browser bundle.
 */
export type MailTransport =
  | { kind: "graph"; oauth: OAuthConfig; mailbox: string }
  | {
      kind: "smtp";
      host: string;
      port: number;
      secure: boolean;
      user: string;
      auth: { kind: "password"; password: string } | { kind: "oauth2"; oauth: OAuthConfig };
    };

export interface MailConfig {
  from: string;
  /** Split from `CONTACT_MAIL_TO`, which may list several addresses. */
  to: string[];
  transport: MailTransport;
}

const value = (name: string) => process.env[name]?.trim() || "";

export function readMailConfig():
  | { ok: true; config: MailConfig }
  | { ok: false; missing: string[] } {
  const user = value("SMTP_USER");
  const to = value("CONTACT_MAIL_TO")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  const tenantId = value("MS_TENANT_ID");
  const clientId = value("MS_CLIENT_ID");
  const clientSecret = readSecret("MS_CLIENT_SECRET");
  const password = readSecret("SMTP_PASSWORD");

  // Any Entra variable present signals intent to use OAuth2; missing ones are
  // then reported rather than silently falling back to a password the tenant
  // will reject anyway.
  const wantsOAuth = Boolean(tenantId || clientId || clientSecret);
  const forced = value("MAIL_TRANSPORT").toLowerCase();
  const useGraph = wantsOAuth && forced !== "smtp";

  const missing: string[] = [];
  if (!user) missing.push("SMTP_USER");
  if (to.length === 0) missing.push("CONTACT_MAIL_TO");

  if (wantsOAuth) {
    if (!tenantId) missing.push("MS_TENANT_ID");
    if (!clientId) missing.push("MS_CLIENT_ID");
    if (!clientSecret) missing.push("MS_CLIENT_SECRET");
  } else if (!password) {
    missing.push("SMTP_PASSWORD (or the MS_* OAuth2 variables)");
  }

  if (!useGraph && !value("SMTP_HOST")) missing.push("SMTP_HOST");

  /**
   * `Number("")` is 0, not NaN, and `??` only catches an *absent* variable —
   * so a present-but-empty `SMTP_PORT`, which is what a deploy platform writes
   * for a blank field and what a stray `SMTP_PORT=` line leaves behind, used to
   * resolve to port 0. Both that and a typo (`NaN`) surfaced only as a
   * connection failure at send time, with nothing naming the cause.
   */
  const portRaw = value("SMTP_PORT");
  const port = portRaw ? Number(portRaw) : 587;
  if (!useGraph && !Number.isInteger(port)) {
    missing.push(`SMTP_PORT (must be a whole number, got "${portRaw}")`);
  }

  if (missing.length > 0) return { ok: false, missing };

  const oauth: OAuthConfig = { tenantId, clientId, clientSecret };

  return {
    ok: true,
    config: {
      // Exchange rejects a From that isn't the sending mailbox.
      from: value("CONTACT_MAIL_FROM") || user,
      to,
      transport: useGraph
        ? { kind: "graph", oauth, mailbox: user }
        : {
            kind: "smtp",
            host: value("SMTP_HOST"),
            port,
            // Implicit TLS on 465; everything else negotiates STARTTLS.
            secure: process.env.SMTP_SECURE
              ? process.env.SMTP_SECURE === "true"
              : port === 465,
            user,
            auth: wantsOAuth
              ? { kind: "oauth2", oauth }
              : { kind: "password", password },
          },
    },
  };
}

/**
 * Cached SMTP transporter. Access tokens expire, so the cache is keyed on the
 * token itself — a refresh rebuilds the transport rather than reusing a pooled
 * connection whose credentials have gone stale.
 */
let cached: { key: string; transporter: Transporter } | undefined;

export async function getTransporter(
  transport: Extract<MailTransport, { kind: "smtp" }>,
): Promise<Transporter> {
  const accessToken =
    transport.auth.kind === "oauth2"
      ? await getAccessToken(transport.auth.oauth, SCOPE.smtp)
      : undefined;

  const auth = accessToken
    ? { type: "OAuth2" as const, user: transport.user, accessToken }
    : {
        user: transport.user,
        pass: (transport.auth as { password: string }).password,
      };

  const key = accessToken ? `oauth:${accessToken.slice(-24)}` : "password";
  if (cached?.key === key) return cached.transporter;

  cached?.transporter.close();
  cached = {
    key,
    transporter: nodemailer.createTransport({
      host: transport.host,
      port: transport.port,
      secure: transport.secure,
      auth,
      pool: true,
      maxConnections: 3,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    }),
  };

  return cached.transporter;
}

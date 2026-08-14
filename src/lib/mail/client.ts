import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { readSecret } from "@/lib/secrets";

import { getAccessToken, type OAuthConfig } from "./oauth";

/**
 * SMTP configuration, read from the environment.
 *
 * Two authentication modes are supported. OAuth2 wins when the Entra
 * credentials are present, because this tenant blocks Basic Authentication
 * (Security Defaults) and a password login is rejected with
 * `535 5.7.139 … locked by your organization's security defaults policy`.
 *
 * Everything here is server-only — no `NEXT_PUBLIC_` prefix, so none of it
 * reaches the browser bundle.
 */
export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  to: string;
  auth: { kind: "password"; password: string } | { kind: "oauth2"; oauth: OAuthConfig };
}

const value = (name: string) => process.env[name]?.trim() || "";

export function readMailConfig():
  | { ok: true; config: MailConfig }
  | { ok: false; missing: string[] } {
  const host = value("SMTP_HOST");
  const user = value("SMTP_USER");
  const to = value("CONTACT_MAIL_TO");

  const tenantId = value("MS_TENANT_ID");
  const clientId = value("MS_CLIENT_ID");
  // Accepts either the plain variable or its encrypted `*_ENC` twin.
  const clientSecret = readSecret("MS_CLIENT_SECRET");
  const password = readSecret("SMTP_PASSWORD");

  // Any Entra variable present signals intent to use OAuth2; missing ones are
  // then reported rather than silently falling back to a password that the
  // tenant will reject anyway.
  const wantsOAuth = Boolean(tenantId || clientId || clientSecret);

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!user) missing.push("SMTP_USER");
  if (!to) missing.push("CONTACT_MAIL_TO");

  if (wantsOAuth) {
    if (!tenantId) missing.push("MS_TENANT_ID");
    if (!clientId) missing.push("MS_CLIENT_ID");
    if (!clientSecret) missing.push("MS_CLIENT_SECRET");
  } else if (!password) {
    missing.push("SMTP_PASSWORD (or the MS_* OAuth2 variables)");
  }

  if (missing.length > 0) return { ok: false, missing };

  const port = Number(process.env.SMTP_PORT ?? 587);

  return {
    ok: true,
    config: {
      host,
      port,
      // Implicit TLS on 465; everything else negotiates STARTTLS.
      secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === "true"
        : port === 465,
      user,
      // Exchange rejects a From that isn't the sending mailbox.
      from: value("CONTACT_MAIL_FROM") || user,
      to,
      auth: wantsOAuth
        ? { kind: "oauth2", oauth: { tenantId, clientId, clientSecret } }
        : { kind: "password", password },
    },
  };
}

/**
 * Cached transporter. Access tokens expire, so the cache is keyed on the token
 * itself — a refreshed token rebuilds the transport instead of reusing a
 * connection that will start failing AUTH.
 */
let cached: { key: string; transporter: Transporter } | undefined;

export async function getTransporter(config: MailConfig): Promise<Transporter> {
  const accessToken =
    config.auth.kind === "oauth2"
      ? await getAccessToken(config.auth.oauth)
      : undefined;

  const auth = accessToken
    ? { type: "OAuth2" as const, user: config.user, accessToken }
    : { user: config.user, pass: (config.auth as { password: string }).password };

  // Keyed on the token so a refresh rebuilds the transport rather than reusing
  // a pooled connection whose credentials have expired.
  const key = accessToken ? `oauth:${accessToken.slice(-24)}` : "password";

  if (cached?.key === key) return cached.transporter;

  cached?.transporter.close();
  cached = {
    key,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
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

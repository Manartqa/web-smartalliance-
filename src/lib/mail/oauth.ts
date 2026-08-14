import "server-only";

/**
 * Entra ID (Azure AD) client-credentials token for SMTP XOAUTH2.
 *
 * The tenant blocks Basic Authentication via Security Defaults, so the mailbox
 * cannot be reached with a password. OAuth2 is the supported route: the app
 * authenticates as itself and sends as the configured mailbox.
 *
 * Requires an App Registration with the **SMTP.SendAsApp** *application*
 * permission (Office 365 Exchange Online) and admin consent granted.
 */
export interface OAuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/** Exchange Online's SMTP scope — not the Graph one. */
const SCOPE = "https://outlook.office365.com/.default";

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cache: CachedToken | undefined;

export async function getAccessToken(config: OAuthConfig): Promise<string> {
  // Reuse until a minute before expiry so a send never races the rollover.
  if (cache && cache.expiresAt > Date.now() + 60_000) return cache.value;

  const endpoint = `https://login.microsoftonline.com/${encodeURIComponent(
    config.tenantId,
  )}/oauth2/v2.0/token`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: SCOPE,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    // error_description carries the actionable part (missing consent, bad
    // secret, wrong tenant) — keep it, it is not sensitive.
    throw new Error(
      `Entra token request failed (${response.status}): ${
        payload.error_description ?? payload.error ?? "unknown error"
      }`,
    );
  }

  cache = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };

  return cache.value;
}

/** Drops the cached token so the next send re-authenticates. */
export function resetTokenCache() {
  cache = undefined;
}

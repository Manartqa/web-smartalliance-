import "server-only";

/**
 * Entra ID (Azure AD) client-credentials token for SMTP XOAUTH2.
 *
 * The tenant blocks Basic Authentication via Security Defaults, so the mailbox
 * cannot be reached with a password. OAuth2 is the supported route: the app
 * authenticates as itself and sends as the configured mailbox.
 *
 * Which application permission is needed depends on the transport:
 * `Mail.Send` on Microsoft Graph, or `SMTP.SendAsApp` on Office 365 Exchange
 * Online. Both need admin consent, and they are **not** interchangeable — a
 * token minted for one resource carries no roles on the other.
 */
export interface OAuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/** The two resources this app can be granted against. */
export const SCOPE = {
  graph: "https://graph.microsoft.com/.default",
  smtp: "https://outlook.office365.com/.default",
} as const;

interface CachedToken {
  value: string;
  expiresAt: number;
}

/** One entry per scope — the two resources issue different tokens. */
const cache = new Map<string, CachedToken>();

export async function getAccessToken(
  config: OAuthConfig,
  scope: string = SCOPE.graph,
): Promise<string> {
  // Reuse until a minute before expiry so a send never races the rollover.
  const hit = cache.get(scope);
  if (hit && hit.expiresAt > Date.now() + 60_000) return hit.value;

  const endpoint = `https://login.microsoftonline.com/${encodeURIComponent(
    config.tenantId,
  )}/oauth2/v2.0/token`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope,
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

  cache.set(scope, {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  });

  return payload.access_token;
}

/** Drops cached tokens so the next send re-authenticates. */
export function resetTokenCache() {
  cache.clear();
}

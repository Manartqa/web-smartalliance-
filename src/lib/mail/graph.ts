import "server-only";

import { getAccessToken, SCOPE, type OAuthConfig } from "./oauth";
import type { ContactMail } from "./contact-template";

/**
 * Delivery through Microsoft Graph `sendMail`.
 *
 * Preferred over SMTP on this tenant: the App Registration already holds the
 * `Mail.Send` application permission, whereas SMTP XOAUTH2 would additionally
 * need `SMTP.SendAsApp` plus an Exchange service principal and a mailbox
 * permission grant. Graph is also plain HTTPS — no SMTP port to keep open.
 */
export interface GraphSendArgs {
  oauth: OAuthConfig;
  /** Mailbox the message is sent as. Must exist in the tenant. */
  mailbox: string;
  /** One or more recipients; `CONTACT_MAIL_TO` may be comma-separated. */
  to: string[];
  mail: ContactMail;
}

const recipients = (addresses: string[]) =>
  addresses.map((address) => ({ emailAddress: { address } }));

export async function sendViaGraph({
  oauth,
  mailbox,
  to,
  mail,
}: GraphSendArgs): Promise<void> {
  const token = await getAccessToken(oauth, SCOPE.graph);

  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    mailbox,
  )}/sendMail`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: mail.subject,
        body: { contentType: "HTML", content: mail.html },
        toRecipients: recipients(to),
        // Replying in the inbox reaches the visitor, while the message itself
        // is still sent by the mailbox — so SPF/DMARC stay intact.
        replyTo: recipients([mail.replyTo]),
      },
      // The website's own copy of every enquiry is the inbox it lands in;
      // cluttering Sent Items adds nothing.
      saveToSentItems: false,
    }),
    cache: "no-store",
  });

  // 202 Accepted is the success case; sendMail returns no body.
  if (response.status === 202) return;

  let detail = `HTTP ${response.status}`;
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    if (payload.error) {
      detail = `${payload.error.code ?? response.status}: ${
        payload.error.message ?? "no message"
      }`;
    }
  } catch {
    // Non-JSON error body — the status alone will have to do.
  }

  throw new Error(`Graph sendMail failed — ${detail}`);
}

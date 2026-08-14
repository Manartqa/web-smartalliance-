import "server-only";

import type { ContactRequest } from "@/types/api/main/contact";

import { getTransporter, readMailConfig } from "./client";
import { buildContactMail } from "./contact-template";
import { sendViaGraph } from "./graph";

export type SendContactResult =
  | { status: "sent"; via: "graph" | "smtp" }
  | { status: "not_configured"; missing: string[] }
  | { status: "send_failed"; reason: string };

/**
 * Delivers one contact submission to the company mailbox.
 *
 * `replyTo` carries the visitor's address so hitting Reply in the inbox goes
 * straight back to them, while the sender stays the configured mailbox —
 * spoofing the visitor there would fail SPF/DMARC on most receivers.
 */
export async function sendContactMail(
  payload: ContactRequest,
): Promise<SendContactResult> {
  let env: ReturnType<typeof readMailConfig>;
  try {
    env = readMailConfig();
  } catch (error) {
    // A bad master key or malformed ciphertext is a configuration fault, not a
    // transport fault — report it as such instead of a 500.
    return {
      status: "not_configured",
      missing: [error instanceof Error ? error.message : String(error)],
    };
  }

  if (!env.ok) return { status: "not_configured", missing: env.missing };

  const { config } = env;
  const mail = buildContactMail(payload);

  try {
    if (config.transport.kind === "graph") {
      await sendViaGraph({
        oauth: config.transport.oauth,
        mailbox: config.transport.mailbox,
        to: config.to,
        mail,
      });
      return { status: "sent", via: "graph" };
    }

    const transporter = await getTransporter(config.transport);
    await transporter.sendMail({
      from: config.from,
      to: config.to.join(", "),
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { status: "sent", via: "smtp" };
  } catch (error) {
    return {
      status: "send_failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

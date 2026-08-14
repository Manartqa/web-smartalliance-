import "server-only";

import type { ContactRequest } from "@/types/api/main/contact";

import { getTransporter, readMailConfig } from "./client";
import { buildContactMail } from "./contact-template";

export type SendContactResult =
  | { status: "sent" }
  | { status: "not_configured"; missing: string[] }
  | { status: "send_failed"; reason: string };

/**
 * Delivers one contact submission to the company mailbox.
 *
 * `replyTo` carries the visitor's address so hitting Reply in the inbox goes
 * straight back to them, while `From` stays the authenticated SMTP mailbox —
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
    const transporter = await getTransporter(config);
    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { status: "sent" };
  } catch (error) {
    return {
      status: "send_failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

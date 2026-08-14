import type { ContactRequest } from "@/types/api/main/contact";

/** Escape anything that lands inside the HTML body of the notification. */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Header injection guard: a newline in a value that ends up in Subject or
 * Reply-To would let a sender append their own headers.
 */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export interface ContactMail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

export function buildContactMail(payload: ContactRequest): ContactMail {
  const subject = payload.subject?.trim()
    ? `[Website] ${singleLine(payload.subject)}`
    : `[Website] New enquiry from ${singleLine(payload.name)}`;

  const rows: Array<[string, string]> = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company ?? "—"],
    ["Phone", payload.phone ?? "—"],
    ["Subject", payload.subject ?? "—"],
  ];

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    payload.message,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f8f9fb;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e4e9ef;border-radius:12px">
    <tr><td style="padding:20px 24px;background:#002a62;border-radius:12px 12px 0 0">
      <span style="color:#ffffff;font-size:16px;font-weight:bold">New enquiry from the website</span>
    </td></tr>
    <tr><td style="padding:24px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#1f2836">
        ${rows
          .map(
            ([label, value]) => `<tr>
          <td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:6px 0">${escapeHtml(value)}</td>
        </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:20px 0 6px;color:#6b7280;font-size:14px">Message</p>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1f2836;border-left:3px solid #ffc300;padding-left:12px">${escapeHtml(
        payload.message,
      )}</div>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html, replyTo: singleLine(payload.email) };
}

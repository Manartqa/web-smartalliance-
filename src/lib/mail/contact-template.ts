import type { ContactRequest } from "@/types/api/main/contact";

/**
 * Escape anything that lands inside the HTML body of the notification.
 *
 * `'` is escaped even though every attribute in this template is
 * double-quoted: the day someone writes `style='…${value}'` the omission turns
 * into script execution inside the recipient's mail client, and that is not a
 * mistake worth leaving available.
 */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Header injection guard: a newline in a value that ends up in Subject or
 * Reply-To would let a sender append their own headers.
 */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/** Office hours are Bangkok time, so the stamp reads in Bangkok time. */
const receivedAt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  dateStyle: "medium",
  timeStyle: "short",
});

const NAVY = "#002a62";
const ACCENT = "#ffc300";
const INK = "#1f2836";
const MUTED = "#7a8699";
const LINE = "#e7ecf3";
const SANS = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface ContactMail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

/**
 * One label/value line. Rendered two-column so the values line up down the
 * card; the label column is fixed-width and `white-space:nowrap` so a long
 * value wraps in its own column instead of squeezing the label.
 */
const detailRow = ([label, value]: [string, string]) => `<tr>
  <td style="padding:11px 16px 11px 0;border-bottom:1px solid ${LINE};font:400 12px/1.5 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${MUTED};white-space:nowrap;vertical-align:top">${label}</td>
  <td style="padding:11px 0;border-bottom:1px solid ${LINE};font:400 15px/1.6 ${SANS};color:${INK};vertical-align:top">${escapeHtml(
    value,
  )}</td>
</tr>`;

export function buildContactMail(payload: ContactRequest): ContactMail {
  const name = singleLine(payload.name);
  const email = singleLine(payload.email);

  const subject = payload.subject?.trim()
    ? `[Website] ${singleLine(payload.subject)}`
    : `[Website] New enquiry from ${name}`;

  // Blank optional fields are dropped rather than printed as a dash — an empty
  // row is noise, and the reader can tell what was left out from what is here.
  const details: Array<[string, string]> = [
    ["Company", payload.company?.trim() ?? ""],
    ["Phone", payload.phone?.trim() ?? ""],
    ["Subject", payload.subject?.trim() ?? ""],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const stamp = receivedAt.format(new Date());

  const text = [
    "NEW ENQUIRY FROM THE WEBSITE",
    `Received: ${stamp} (ICT)`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    payload.message,
    "",
    "—",
    "Sent automatically by the smartalliance.co.th contact form.",
  ].join("\n");

  // Preheader: the grey line inboxes show next to the subject. Padded so the
  // client cannot pull the message body into the preview after it.
  const preheader = `${name} · ${email}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
<style>
  /* Progressive only — every client-critical style is inlined below. */
  @media only screen and (max-width:620px) {
    .sa-pad { padding-left:22px !important; padding-right:22px !important; }
    .sa-name { font-size:20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background:#eef1f6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(
    preheader,
  )}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eef1f6">
    <tr>
      <td align="center" style="padding:32px 12px">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,.08)">

          <!-- Accent rule: the one spot of brand yellow, so the navy header
               does not read as a flat block. -->
          <tr><td style="height:4px;background:${ACCENT};font-size:0;line-height:0">&nbsp;</td></tr>

          <tr>
            <td class="sa-pad" style="padding:26px 32px;background:${NAVY}">
              <p style="margin:0;font:600 17px/1.4 ${SANS};color:#ffffff">New enquiry from the website</p>
              <p style="margin:6px 0 0;font:400 13px/1.5 ${SANS};color:#a9bede">Received ${escapeHtml(
                stamp,
              )} (ICT)</p>
            </td>
          </tr>

          <tr>
            <td class="sa-pad" style="padding:32px 32px 8px">
              <p class="sa-name" style="margin:0;font:600 22px/1.3 ${SANS};color:${INK}">${escapeHtml(
                name,
              )}</p>
              <p style="margin:6px 0 0;font:400 15px/1.6 ${SANS}">
                <a href="mailto:${encodeURIComponent(email)}" style="color:#1462b8;text-decoration:none">${escapeHtml(
                  email,
                )}</a>
              </p>

              <!-- Table-wrapped button: Outlook drops padding on a bare <a>. -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0">
                <tr>
                  <td align="center" bgcolor="${ACCENT}" style="border-radius:8px">
                    <a href="mailto:${encodeURIComponent(
                      email,
                    )}?subject=${encodeURIComponent(
                      `Re: ${payload.subject?.trim() || "Your enquiry"}`,
                    )}" style="display:inline-block;padding:12px 24px;font:600 14px/1 ${SANS};color:${NAVY};text-decoration:none;border-radius:8px">Reply to this enquiry &rsaquo;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            details.length
              ? `<tr>
            <td class="sa-pad" style="padding:24px 32px 0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-top:1px solid ${LINE}">
                ${details.map(detailRow).join("")}
              </table>
            </td>
          </tr>`
              : ""
          }

          <tr>
            <td class="sa-pad" style="padding:26px 32px 32px">
              <p style="margin:0 0 10px;font:600 12px/1.5 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${MUTED}">Message</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#f6f8fb;border-radius:10px">
                <tr>
                  <td style="padding:18px 20px;border-left:3px solid ${ACCENT};font:400 15px/1.7 ${SANS};color:${INK};white-space:pre-wrap">${escapeHtml(
                    payload.message,
                  )}</td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <p style="margin:18px 0 0;font:400 12px/1.6 ${SANS};color:#93a0b4;text-align:center">
          Sent automatically by the smartalliance.co.th contact form.<br>Reply goes straight to the sender.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html, replyTo: email };
}

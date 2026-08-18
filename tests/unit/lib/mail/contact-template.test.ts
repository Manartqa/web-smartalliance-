import { describe, expect, it } from "vitest";

import { buildContactMail } from "@/lib/mail/contact-template";
import type { ContactRequest } from "@/types/api/main/contact";

const base: ContactRequest = {
  name: "Somchai Jaidee",
  email: "somchai@example.co.th",
  message: "We would like a quote for Axway MFT.",
};

const build = (overrides: Partial<ContactRequest> = {}) =>
  buildContactMail({ ...base, ...overrides });

describe("buildContactMail — subject", () => {
  it("uses the sender's subject, tagged", () => {
    expect(build({ subject: "MFT licensing" }).subject).toBe(
      "[Website] MFT licensing",
    );
  });

  it("falls back to the sender's name when no subject is given", () => {
    expect(build().subject).toBe("[Website] New enquiry from Somchai Jaidee");
  });

  it.each([undefined, "", "   "])(
    "treats subject %j as absent",
    (subject) => {
      expect(build({ subject }).subject).toBe(
        "[Website] New enquiry from Somchai Jaidee",
      );
    },
  );
});

/**
 * The header-injection guard. A newline that survives into Subject or Reply-To
 * lets the sender append their own SMTP headers — a Bcc to a third party, or a
 * rewritten From. `EMAIL_PATTERN` already blocks it at the route, so this is
 * the second of the two independent barriers.
 */
describe("buildContactMail — header injection", () => {
  it("flattens CRLF in the subject to a single line", () => {
    const { subject } = build({
      subject: "Hello\r\nBcc: victim@example.com",
    });

    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe("[Website] Hello Bcc: victim@example.com");
  });

  it("flattens CRLF in the name used by the fallback subject", () => {
    const { subject } = build({ name: "Bot\nBcc: victim@example.com" });

    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("flattens CRLF in the address that becomes Reply-To", () => {
    const { replyTo } = build({
      email: "attacker@example.com\r\nBcc: victim@example.com",
    });

    expect(replyTo).not.toMatch(/[\r\n]/);
  });

  it("collapses a run of newlines into one space and trims the result", () => {
    expect(build({ subject: "  a\n\n\r\nb  " }).subject).toBe("[Website] a b");
  });

  it("leaves newlines in the message body alone", () => {
    // The body is not a header — its line breaks are the sender's formatting
    // and `white-space:pre-wrap` renders them.
    const { text } = build({ message: "line one\nline two" });
    expect(text).toContain("line one\nline two");
  });
});

describe("buildContactMail — HTML escaping", () => {
  const XSS = '<img src=x onerror="alert(1)">';

  it.each([
    ["name", (v: string) => build({ name: v })],
    ["message", (v: string) => build({ message: v })],
    ["company", (v: string) => build({ company: v })],
    ["phone", (v: string) => build({ phone: v })],
    ["subject", (v: string) => build({ subject: v })],
  ])("escapes markup supplied in %s", (_field, make) => {
    const { html } = make(XSS);

    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain('onerror="alert(1)"');
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("escapes the ampersand first, so escaping is not double-applied", () => {
    // `&lt;` in the input must survive as `&amp;lt;`, not collapse back to `<`.
    const { html } = build({ message: "&lt;script&gt;" });

    expect(html).toContain("&amp;lt;script&amp;gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes the single quote as well as the double", () => {
    const { html } = build({ name: "O'Brien" });

    expect(html).toContain("O&#39;Brien");
    expect(html).not.toContain("O'Brien");
  });

  it("escapes the subject where it is written into <title>", () => {
    const { html } = build({ subject: "</title><script>alert(1)</script>" });

    expect(html).not.toContain("</title><script>");
    expect(html).toContain("&lt;/title&gt;&lt;script&gt;");
  });

  it("leaves no unescaped angle bracket from user input anywhere in the html", () => {
    // Sentinels are field-specific and unlike anything in the template's own
    // markup, so a hit is always user input and never the template quoting a
    // tag name in a comment.
    const fields = ["name", "company", "phone", "subject", "message"] as const;
    const { html } = build(
      Object.fromEntries(fields.map((f) => [f, `<xss-${f}>`])),
    );

    for (const field of fields) {
      expect(html, `raw <xss-${field}> reached the html`).not.toContain(
        `<xss-${field}>`,
      );
      expect(html).toContain(`&lt;xss-${field}&gt;`);
    }
  });

  it("percent-encodes the address in the mailto: hrefs", () => {
    const { html } = build({ email: "a+b@example.com" });

    // A raw `+` in a mailto: URL is a space; the address must survive a click.
    expect(html).toContain("mailto:a%2Bb%40example.com");
  });
});

describe("buildContactMail — optional detail rows", () => {
  it("omits every optional row when none are supplied", () => {
    const { text, html } = build();

    expect(text).not.toContain("Company:");
    expect(text).not.toContain("Phone:");
    expect(html).not.toContain("Company");
    expect(html).not.toContain("Phone");
  });

  it.each([
    ["company", "Acme Co."],
    ["phone", "+66 2 000 0000"],
    ["subject", "MFT licensing"],
  ])("includes the %s row when supplied", (field, value) => {
    const { text, html } = build({ [field]: value });
    const label = field[0]!.toUpperCase() + field.slice(1);

    expect(text).toContain(`${label}: ${value}`);
    expect(html).toContain(label);
    expect(html).toContain(value);
  });

  it.each(["", "   "])("omits a blank %j optional field", (blank) => {
    const { text } = build({ company: blank, phone: blank });

    expect(text).not.toContain("Company:");
    expect(text).not.toContain("Phone:");
  });

  it("keeps the rows in the template's declared order", () => {
    const { text } = build({
      company: "Acme Co.",
      phone: "+66 2 000 0000",
      subject: "MFT licensing",
    });

    expect(text.indexOf("Company:")).toBeLessThan(text.indexOf("Phone:"));
    expect(text.indexOf("Phone:")).toBeLessThan(text.indexOf("Subject:"));
  });
});

describe("buildContactMail — body content", () => {
  it("carries the sender's address as Reply-To", () => {
    expect(build().replyTo).toBe("somchai@example.co.th");
  });

  it("includes the name, address and message in the plain-text part", () => {
    const { text } = build();

    expect(text).toContain("Name: Somchai Jaidee");
    expect(text).toContain("Email: somchai@example.co.th");
    expect(text).toContain("We would like a quote for Axway MFT.");
  });

  it("stamps the arrival time in Bangkok time", () => {
    const { text } = build();

    // Office hours are ICT, so a UTC stamp would read an hour or seven off.
    expect(text).toMatch(/Received: .+ \(ICT\)/);
  });

  it("produces a complete html document", () => {
    const { html } = build();

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("puts the sender in the preheader", () => {
    const { html } = build();

    expect(html).toContain("Somchai Jaidee · somchai@example.co.th");
  });
});

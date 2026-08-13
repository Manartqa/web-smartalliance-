import { NextResponse } from "next/server";

interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  // ---------------------------------------------------------------------
  // NOT WIRED YET. No mail transport is configured, so this route refuses
  // rather than accepting a submission it would silently drop.
  //
  // To go live, pick a transport (Resend, SES, company SMTP), send the mail
  // here, and delete this guard. Add spam protection (Turnstile/reCAPTCHA)
  // and rate limiting at the same time.
  // ---------------------------------------------------------------------
  if (!process.env.CONTACT_MAIL_TO) {
    console.warn(
      "[contact] CONTACT_MAIL_TO is not set — submission rejected.",
      { name, email, hasMessage: message.length > 0 },
    );
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
